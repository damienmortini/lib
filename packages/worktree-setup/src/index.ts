// A fresh git worktree has no node_modules at all, so nothing resolves in it — not a
// workspace package, not a third-party dependency, not a local binary. Installing into the
// worktree is not an option either: a workspace that reaches sibling checkouts through
// committed `submodules/*` symlinks writes outside the worktree when it installs, and into
// the checkouts other people are working in. This mirrors the primary checkout's node_modules
// instead: every installed package is symlinked across, while scope directories (`@scope`,
// `@types`, …) and `.bin` are recreated with their original relative links, so workspace
// specifiers resolve to the worktree's own packages rather than the primary checkout's —
// including packages the branch adds, which the primary checkout knows nothing about.
//
// The branch's own tree is the measure of the result, not the primary's. Workspace members
// come from the globs the worktree's pnpm-workspace.yaml declares as well as the
// `packageDirectories` option, and every dependency declared by a manifest the worktree
// itself holds — the root and the members not reached through submodule links, whose own
// dependencies are their sibling checkout's install to answer for — is then verified to
// resolve: linked from the primary's install where the mirror alone did not carry it, and
// refused loudly, naming the manifest and the name, where nothing can.
//
// One copy, every repository that uses it. Everything below is the same everywhere; what
// differs between them is passed in as options, so a fix lands once rather than being
// re-derived per repository — which is how the per-repository copies drifted apart in the
// first place.

import { execFileSync } from 'node:child_process';
import { existsSync, realpathSync, statSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface WorktreeSetupOptions {
  /** A directory inside the worktree to set up. Defaults to the current working directory. */
  directory?: string;
  /**
   * Directories holding workspace packages, relative to the worktree root — `packages` for
   * a repository that has its own, nothing for one whose packages all come from submodules.
   * Missing directories are skipped, so a branch may add or drop one. The `packages` globs
   * of the worktree's own `pnpm-workspace.yaml` are always walked as well, so this option
   * is only for roots that file does not declare.
   */
  packageDirectories?: string[];
  /**
   * Package names that must resolve from the worktree once the tree is linked. Name the
   * ones whose absence a repository's gates report as something else entirely: tsc reports
   * a config it cannot find and a cascade of missing globals, eslint dies in module
   * resolution with no message at all.
   */
  requiredPackages?: string[];
  /**
   * Directories whose committed symlinks must resolve from the worktree — `submodules` for
   * a repository whose sources name `submodules/…` paths directly, since repairing
   * node_modules does not repair the tracked links themselves.
   */
  resolvedLinkDirectories?: string[];
}

function git(gitArguments: string[], directory: string): string {
  return execFileSync('git', gitArguments, { cwd: directory, encoding: 'utf8' }).trim();
}

// Both answers come back resolved, because they are compared to each other: git resolves
// `--show-toplevel` itself while `git worktree list` reports the path recorded when the
// worktree was registered — equal here, but not something the comparison should rest on
// across git versions and platforms (`/tmp` → `/private/tmp`, symlinked CI checkouts). One
// directory spelled two ways would clear the guard below as "this is a linked worktree",
// pointing the mirroring at the primary's own node_modules, which `materialize` deletes
// before it reads. That directory is shared with every other worktree and costs a full
// install.

/** The root of the checkout `directory` is in, primary or linked worktree. */
export function currentCheckoutPath(directory: string): string {
  return realpathSync(git(['rev-parse', '--show-toplevel'], directory));
}

/** The root of the primary checkout — the one worktree that is not throwaway. */
export function primaryCheckoutPath(directory: string): string {
  // git lists the main worktree — the one holding the installed node_modules — first.
  return realpathSync(git(['worktree', 'list', '--porcelain'], directory).split('\n')[0].replace(/^worktree /, ''));
}

/**
 * Recreate `source` at `target` as a tree of symlinks: relative links are copied verbatim
 * so they resolve inside the worktree, everything else points at the primary. Removing
 * `target` first keeps re-runs idempotent. Every copied link is recorded in `copiedLinks`
 * for `repairDanglingLinks` to look at afterwards.
 */
async function materialize(source: string, target: string, copiedLinks: string[]): Promise<void> {
  await fs.rm(target, { recursive: true, force: true });
  await fs.mkdir(target, { recursive: true });

  for (const entry of await fs.readdir(source, { withFileTypes: true })) {
    // pnpm's own bookkeeping (`.modules.yaml`, `.pnpm`, …) describes the primary checkout.
    // Linking it would let an install run here write back into the shared checkout, so
    // leave it out and let pnpm treat this worktree as the uninstalled tree it is.
    if (entry.name.startsWith('.') && entry.name !== '.bin') continue;

    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isSymbolicLink()) {
      await fs.symlink(await fs.readlink(sourcePath), targetPath);
      copiedLinks.push(targetPath);
    }
    else if (entry.isDirectory() && (entry.name.startsWith('@') || entry.name === '.bin')) {
      await materialize(sourcePath, targetPath, copiedLinks);
    }
    else {
      await fs.symlink(sourcePath, targetPath);
    }
  }
}

/**
 * Point the copied links that do not resolve here at the primary checkout instead, and
 * return the ones that could not be repaired.
 *
 * `submodules/<name>` is a committed relative symlink (`../../<name>`), so it resolves only
 * for a checkout sitting directly beside the repositories it names — which a worktree
 * created anywhere else is not. Every `node_modules` entry that points through one dangles
 * in such a worktree, taking whole scopes with it.
 *
 * The primary resolves them, so its own path is what these are pointed at — the same real
 * directory it reads. Repointing rather than rewriting `submodules/*`: those are tracked
 * files, and editing them would leave every worktree permanently dirty with a modification
 * somebody could commit.
 *
 * Run once the whole tree is built rather than as each link is made: a `.bin` entry points
 * at a sibling package that may not have been linked yet, so a check made on the way past
 * would read it as dangling and repoint it at the primary — undoing exactly what copying
 * relative links verbatim is for.
 *
 * A branch that deletes a workspace package dangles its hoisted link exactly the same way,
 * and must not be repaired: the primary still has the package, so pointing there would
 * resolve an import the branch removed against code the branch does not have — the mirror
 * image of a package the branch adds, and wrong for the same reason. The link cannot say
 * which happened, since `submodules/<name>/packages/x` and `packages/x` alike sit under the
 * worktree root; where the primary resolves it can. Content the checkout itself holds is the
 * branch's to delete, so the worktree's own copy is the only answer; content outside it is
 * the same real directory either checkout would reach, which is what makes the primary a
 * stand-in at all. A node_modules on the way is neither — installed contents, which no branch
 * adds to or deletes from. Any of them, not just the checkout's own: `materialize` mirrors
 * the nested trees pnpm writes under `packages/<name>/node_modules` too, and a non-hoisted
 * layout puts a store in each one.
 */
async function repairDanglingLinks(copiedLinks: string[], worktreeRoot: string, primaryRoot: string): Promise<string[]> {
  const unrepaired: string[] = [];

  for (const link of copiedLinks) {
    // Follows the link, so this is false for one that dangles.
    if (existsSync(link)) continue;
    const primaryPath = path.join(primaryRoot, path.relative(worktreeRoot, link));
    if (!existsSync(primaryPath)) {
      unrepaired.push(link);
      continue;
    }
    const primaryTarget = realpathSync(primaryPath);
    if (isCheckoutOwnContent(primaryRoot, primaryTarget)) continue;
    await fs.rm(link, { force: true });
    await fs.symlink(primaryTarget, link);
  }

  return unrepaired;
}

/**
 * Inside the checkout and outside any node_modules: content of the branch's own, which
 * only the worktree's copy can answer for — the primary must never stand in for it.
 */
function isCheckoutOwnContent(primaryRoot: string, target: string): boolean {
  const fromPrimaryRoot = path.relative(primaryRoot, target).split(path.sep);
  return fromPrimaryRoot[0] !== '..' && !fromPrimaryRoot.includes('node_modules');
}

interface PackageManifest {
  name?: unknown;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

/** The parsed package.json at `manifestPath` under `worktreeRoot`, failing with the file named rather than a bare parse error reporting a position in a file it never mentions. */
async function readManifest(worktreeRoot: string, manifestPath: string): Promise<PackageManifest> {
  try {
    return JSON.parse(await fs.readFile(path.join(worktreeRoot, manifestPath), 'utf8'));
  }
  catch (error) {
    throw new Error(`Cannot read ${manifestPath} in ${worktreeRoot}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
  }
}

/**
 * The `packages` globs of the worktree's own `pnpm-workspace.yaml`, or nothing when the
 * repository has none. Parsed by hand and only this one block of it, because this package
 * must resolve nothing to run — the bootstrap path executes it with nothing installed in any
 * checkout, so a YAML dependency is not an option. Shapes the narrow parser cannot read are
 * refused rather than skipped: a glob dropped silently would link a tree the workspace never
 * declared and report it ready.
 */
async function workspacePackageGlobs(worktreeRoot: string): Promise<string[]> {
  const filePath = path.join(worktreeRoot, 'pnpm-workspace.yaml');
  if (!existsSync(filePath)) return [];

  const globs: string[] = [];
  let inPackagesBlock = false;
  for (const line of (await fs.readFile(filePath, 'utf8')).split('\n')) {
    // Comments and document markers carry nothing and end nothing — a flush-left `#` inside
    // the block must not read as the next top-level key and silently drop the globs after it.
    if (/^\s*#/.test(line) || /^---\s*$/.test(line)) continue;
    const packagesKey = line.match(/^(?:packages|'packages'|"packages")\s*:(.*)$/);
    if (packagesKey) {
      if (packagesKey[1].replace(/#.*$/, '').trim() !== '') {
        throw new Error(`${filePath} declares \`packages\` in a form this setup cannot read — use a block list of globs, one \`- \` line each.`);
      }
      inPackagesBlock = true;
      continue;
    }
    if (!inPackagesBlock) continue;
    const item = line.match(/^\s*-\s+(?:'([^']*)'|"([^"]*)"|([^#]+))/);
    if (item) {
      const glob = (item[1] ?? item[2] ?? item[3]).trim();
      if (glob.startsWith('!')) {
        throw new Error(`${filePath} declares an exclusion glob (${glob}), which this setup does not support.`);
      }
      globs.push(glob);
    }
    else if (/^\S/.test(line)) {
      inPackagesBlock = false;
    }
  }
  return globs;
}

/** Installed, built, and hidden trees, which no walk here descends — one list for every walker, so which source declared a root cannot change which members it finds. */
function isSkippedDirectoryName(name: string): boolean {
  return name === 'node_modules' || name === 'dist' || name.startsWith('.');
}

/**
 * Directories under `worktreeRoot` matching one workspace glob and holding a package.json,
 * relative to the worktree root. Every segment follows symlinks, because that is what a
 * workspace root reached through a committed submodule link is — the very members a plain
 * directory walk cannot see — with `**` carrying a seen-set so a symlink cycle cannot
 * recurse forever. A glob shape this cannot expand (`web-*`, `pkg?`, `{a,b}`) is refused
 * rather than matched against nothing: a silently empty expansion would link a worktree
 * with fewer members than the workspace declares and report it ready.
 */
async function expandWorkspaceGlob(worktreeRoot: string, glob: string): Promise<string[]> {
  // Checked before expanding anything, so the refusal cannot be skipped by an earlier
  // segment matching no directory at all.
  for (const segment of glob.split('/')) {
    if (segment !== '*' && segment !== '**' && /[*?[\]{}]/.test(segment)) {
      throw new Error(`pnpm-workspace.yaml declares a glob this setup cannot expand (${glob}) — only literal path segments, \`*\`, and \`**\` are supported.`);
    }
  }

  let matches = [''];
  for (const segment of glob.split('/')) {
    const next = new Set<string>();
    for (const directory of matches) {
      if (segment === '**') {
        next.add(directory);
        const seen = new Set([realpathSync(path.join(worktreeRoot, directory))]);
        for (const descendant of await descendantDirectories(worktreeRoot, directory, seen)) next.add(descendant);
      }
      else if (segment === '*') {
        for (const entry of await fs.readdir(path.join(worktreeRoot, directory), { withFileTypes: true })) {
          if (isSkippedDirectoryName(entry.name)) continue;
          const child = path.join(directory, entry.name);
          if (statSync(path.join(worktreeRoot, child), { throwIfNoEntry: false })?.isDirectory()) next.add(child);
        }
      }
      else {
        const child = path.join(directory, segment);
        if (statSync(path.join(worktreeRoot, child), { throwIfNoEntry: false })?.isDirectory()) next.add(child);
      }
    }
    matches = [...next];
  }
  return matches.filter(directory => directory !== '' && existsSync(path.join(worktreeRoot, directory, 'package.json')));
}

/** Every directory below `directory`, symlinks followed, each real path descended once. */
async function descendantDirectories(worktreeRoot: string, directory: string, seen: Set<string>): Promise<string[]> {
  const descendants: string[] = [];
  for (const entry of await fs.readdir(path.join(worktreeRoot, directory), { withFileTypes: true })) {
    if (isSkippedDirectoryName(entry.name)) continue;
    const child = path.join(directory, entry.name);
    const childPath = path.join(worktreeRoot, child);
    if (!statSync(childPath, { throwIfNoEntry: false })?.isDirectory()) continue;
    const realChildPath = realpathSync(childPath);
    if (seen.has(realChildPath)) continue;
    seen.add(realChildPath);
    descendants.push(child, ...await descendantDirectories(worktreeRoot, child, seen));
  }
  return descendants;
}

/**
 * Where `name` resolves walking up from `packageDirectory` the way node does — the nearest
 * `node_modules/<name>` between the package and the checkout root — or nothing. Existence is
 * the criterion, same as `requiredPackages`: what a linked tree can answer for.
 */
function resolveThroughCheckout(checkoutRoot: string, packageDirectory: string, name: string): string | undefined {
  let directory = path.join(checkoutRoot, packageDirectory);
  while (true) {
    const candidate = path.join(directory, 'node_modules', name);
    if (existsSync(candidate)) return candidate;
    if (directory === checkoutRoot) return undefined;
    directory = path.dirname(directory);
  }
}

/** The symlinks directly inside `directory` that do not resolve, relative to the worktree root. */
async function danglingLinksIn(worktreeRoot: string, directory: string): Promise<string[]> {
  if (!existsSync(path.join(worktreeRoot, directory))) return [];

  return (await fs.readdir(path.join(worktreeRoot, directory), { withFileTypes: true }))
    .filter(entry => entry.isSymbolicLink() && !existsSync(path.join(worktreeRoot, directory, entry.name)))
    .map(entry => path.join(directory, entry.name));
}

/**
 * Link a fresh worktree against the primary checkout's installed dependencies. Logs what it
 * linked; throws with the whole diagnosis when the tree it built cannot resolve what the
 * caller said it needs — a wrong success is worse than a clear failure, and reporting a
 * worktree ready when it cannot run its own gates is what sends the next reader looking for
 * what their branch had broken.
 *
 * The link tree is all of it. Whatever a repository does with the tree afterwards — build
 * its packages, announce itself done — is the caller's, which is also the only side that
 * knows whether a flag asked it to be skipped.
 */
export async function setupWorktree(options: WorktreeSetupOptions = {}): Promise<void> {
  const {
    directory = process.cwd(),
    packageDirectories = [],
    requiredPackages = [],
    resolvedLinkDirectories = [],
  } = options;

  const worktreeRoot = currentCheckoutPath(directory);
  const primaryRoot = primaryCheckoutPath(directory);

  if (worktreeRoot === primaryRoot) {
    throw new Error(`${worktreeRoot} is the primary checkout — run this from inside a linked worktree (its node_modules comes from \`pnpm install\`).`);
  }

  const copiedLinks: string[] = [];
  await materialize(path.join(primaryRoot, 'node_modules'), path.join(worktreeRoot, 'node_modules'), copiedLinks);

  // The worktree's own manifests drive this, not the primary checkout's: a package added on
  // the branch exists in neither the primary's tree nor its hoisted scope, and used to be
  // the one thing still linked by hand. Resolving to the primary instead is
  // also what silently breaks a dev server that serves the worktree — a package reached
  // through a path outside that root renders as a blank element. Membership is the union of
  // the `packageDirectories` walk and the globs the worktree's own pnpm-workspace.yaml
  // declares, because the yaml is where a workspace states its roots — a member under a
  // `submodules/*` glob is one the hand-kept option never named.
  const workspacePackageDirectories = new Set<string>();
  for (const packageRoot of packageDirectories) {
    // The option names a root to scan whole, which is the `**` expansion of it — one walker
    // for both sources, so which one declared a root cannot change which members it finds.
    for (const packageDirectory of await expandWorkspaceGlob(worktreeRoot, `${packageRoot}/**`)) {
      workspacePackageDirectories.add(packageDirectory);
    }
  }
  for (const glob of await workspacePackageGlobs(worktreeRoot)) {
    for (const packageDirectory of await expandWorkspaceGlob(worktreeRoot, glob)) {
      workspacePackageDirectories.add(packageDirectory);
    }
  }

  // The members whose content is the worktree's own, each carrying its parsed manifest for
  // the dependency check below. One reached through a submodule symlink is a sibling
  // checkout's real directory — shared with every other checkout and installed by that
  // repository itself — so it gets its scope link but nothing may be written inside it:
  // mirroring a node_modules into it would delete the sibling's installed tree, and its
  // declared dependencies are that repository's own install to answer for.
  const ownManifests: { directory: string; manifest: PackageManifest }[] = [];
  let workspacePackageCount = 0;

  for (const packageDirectory of workspacePackageDirectories) {
    const manifest = await readManifest(worktreeRoot, path.join(packageDirectory, 'package.json'));
    const { name } = manifest;
    // No name at all is no workspace member pnpm could link either — a test fixture, most
    // often, and the always-read workspace globs sweep those up. Skipped, not refused: pnpm
    // itself links past them.
    if (name === undefined) continue;

    const modulesRoot = path.join(worktreeRoot, 'node_modules');
    const scopedLink = typeof name === 'string' ? path.join(modulesRoot, name) : '';
    // `name` is whatever the branch being set up wrote in a package.json, and two lines
    // below it drives a recursive forced delete. `path.join` collapses `..`, so a name
    // spelled to climb out of the tree would aim that delete anywhere the user can write —
    // and a worktree is often somebody else's branch, checked out to review it. Contained
    // here rather than trusted.
    if (!scopedLink.startsWith(modulesRoot + path.sep)) {
      throw new Error(`${packageDirectory}/package.json declares an unusable name (${JSON.stringify(name)}): the workspace link it asks for would land outside ${modulesRoot}.`);
    }

    workspacePackageCount++;
    if (realpathSync(path.join(worktreeRoot, packageDirectory)).startsWith(worktreeRoot + path.sep)) {
      ownManifests.push({ directory: packageDirectory, manifest });
      const nestedModules = path.join(primaryRoot, packageDirectory, 'node_modules');
      if (existsSync(nestedModules)) {
        // pnpm nests what it cannot hoist — a version conflict, and the workspace links
        // between sibling packages, which are relative and so follow the worktree's own
        // sources across.
        await materialize(nestedModules, path.join(worktreeRoot, packageDirectory, 'node_modules'), copiedLinks);
      }
    }

    await fs.mkdir(path.dirname(scopedLink), { recursive: true });
    await fs.rm(scopedLink, { recursive: true, force: true });
    await fs.symlink(path.relative(path.dirname(scopedLink), path.join(worktreeRoot, packageDirectory)), scopedLink);
  }

  const unrepaired = await repairDanglingLinks(copiedLinks, worktreeRoot, primaryRoot);

  // Every dependency the branch's own manifests declare must resolve from the package that
  // declares it, checked rather than assumed: mirroring covers only edges the primary has
  // installed, and a hoisted store happening to hold a name is not the same as the tree
  // honouring what the branch wrote. Peer and optional dependencies stay out of it — peers
  // resolve from whoever consumes the package, and optional ones are declared as allowed to
  // be absent.
  const unresolvableDependencies: string[] = [];
  let declaredDependencyCount = 0;
  // The root manifest joins the members: a branch can add a root devDependency the same way.
  // Its absence is legitimate for a repository whose packages all come from elsewhere, so it
  // is skipped rather than required.
  const checkedManifests = [...ownManifests];
  if (existsSync(path.join(worktreeRoot, 'package.json'))) {
    checkedManifests.unshift({ directory: '', manifest: await readManifest(worktreeRoot, 'package.json') });
  }
  for (const { directory: manifestDirectory, manifest } of checkedManifests) {
    const manifestPath = path.join(manifestDirectory, 'package.json');
    const declaredNames = new Set([
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.devDependencies ?? {}),
    ]);

    for (const name of declaredNames) {
      declaredDependencyCount++;
      // The same containment the workspace-link delete gets: `name` is a manifest's word,
      // and below it decides where a link is written.
      const declaringModules = path.join(worktreeRoot, manifestDirectory, 'node_modules');
      const dependencyLink = path.join(declaringModules, name);
      if (!dependencyLink.startsWith(declaringModules + path.sep)) {
        unresolvableDependencies.push(`${manifestPath} declares an unusable dependency name (${JSON.stringify(name)}).`);
        continue;
      }
      if (resolveThroughCheckout(worktreeRoot, manifestDirectory, name)) continue;

      const primaryCandidate = resolveThroughCheckout(primaryRoot, manifestDirectory, name);
      if (!primaryCandidate) {
        unresolvableDependencies.push(`${manifestPath} declares ${name}, which ${primaryRoot} has not installed anywhere — the primary checkout's install is the only store this setup links from.`);
        continue;
      }
      const target = realpathSync(primaryCandidate);
      if (isCheckoutOwnContent(primaryRoot, target)) {
        unresolvableDependencies.push(`${manifestPath} declares ${name}, which only ${primaryRoot}'s own sources resolve — this branch does not have that package.`);
        continue;
      }
      await fs.mkdir(path.dirname(dependencyLink), { recursive: true });
      await fs.rm(dependencyLink, { force: true });
      await fs.symlink(target, dependencyLink);
    }
  }

  const missingPackages = requiredPackages.filter(name => !existsSync(path.join(worktreeRoot, 'node_modules', name)));
  const danglingLinks = (await Promise.all(resolvedLinkDirectories.map(directory => danglingLinksIn(worktreeRoot, directory)))).flat();

  // Reported together when they happen together: they share a cause, and fixing where the
  // worktree lives fixes both at once.
  if (unresolvableDependencies.length > 0 || missingPackages.length > 0 || danglingLinks.length > 0) {
    const reasons: string[] = [...unresolvableDependencies];
    if (missingPackages.length > 0) {
      reasons.push(`Cannot resolve ${missingPackages.join(' or ')} from ${worktreeRoot}.`);
    }
    // Evidence on every failure: a stale link that dangles in the primary too can be the
    // very reason a declared name reads as never installed, so the reader gets the count
    // whatever else went wrong.
    if (unrepaired.length > 0) {
      reasons.push(`${unrepaired.length} copied link(s) could not be pointed at the primary checkout either.`);
    }
    if (danglingLinks.length > 0) {
      reasons.push(`${danglingLinks.join(' and ')} dangle from here, and repairing node_modules does not repair the tracked links themselves.`);
    }
    // Where the worktree lives is the answer to a link that dangles, and only to that. Said
    // on a dependency-only failure it would send a reader whose package is merely not
    // installed off to move a worktree that was never in the wrong place — a confident wrong
    // diagnosis, which is worse than none at all and is exactly what this package exists to
    // stop repeating.
    if (danglingLinks.length > 0 || (missingPackages.length > 0 && unrepaired.length > 0)) {
      reasons.push(`Links committed as \`../../<name>\` resolve only for a checkout sitting directly under ${path.dirname(primaryRoot)} — and this worktree is at ${worktreeRoot}. Create it there instead: \`git worktree add ${path.join(path.dirname(primaryRoot), '<name>')}\`.`);
    }
    throw new Error(reasons.join('\n'));
  }

  // Counted from the branch's tree — the workspace members its checkout holds and the
  // dependencies its manifests declare — not from how much of the primary was mirrored,
  // which says nothing about whether this worktree resolves what it needs. Opening with the
  // mirror keeps a repository with no members of its own from reading its own success as
  // nothing done.
  console.log(`Linked the worktree against ${primaryRoot}'s install: ${workspacePackageCount} workspace package${workspacePackageCount === 1 ? '' : 's'}, ${declaredDependencyCount === 1 ? '1 declared dependency' : `${declaredDependencyCount} declared dependencies`} verified.`);

  // Said out loud rather than left to a failure, which only mentions these when something
  // else went wrong at the same time. Not a failure on its own: a link reaches this list by
  // dangling in the primary checkout too — a stale `.bin` entry pnpm left behind, most of
  // the time — so the worktree is no worse off than the tree it mirrors, and failing over it
  // would blame the branch for the state of the checkout beside it. Worth a line all the
  // same, because it is the answer when something later will not run.
  if (unrepaired.length > 0) {
    console.log(`${unrepaired.length} copied link(s) dangle here and in ${primaryRoot} too, so they were left alone.`);
  }
}
