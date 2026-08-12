// A fresh git worktree has no node_modules at all, so nothing resolves in it — not a
// workspace package, not a third-party dependency, not a local binary. Installing into the
// worktree is not an option either: these repositories reach their siblings through
// `submodules/*` symlinks, so an install there writes outside the worktree and into the
// checkouts other agents are working in. This mirrors the primary checkout's node_modules
// instead: every installed package is symlinked across, while scope directories (`@scope`,
// `@types`, …) and `.bin` are recreated with their original relative links, so workspace
// specifiers resolve to the worktree's own packages rather than the primary checkout's —
// including packages the branch adds, which the primary checkout knows nothing about.
//
// One copy, four repositories. Everything below is the same everywhere; what differs
// between them is passed in as options, so a fix lands once rather than being re-derived
// per repository — which is how the copies drifted apart in the first place.

import { execFileSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface WorktreeSetupOptions {
  /** A directory inside the worktree to set up. Defaults to the current working directory. */
  directory?: string;
  /**
   * Directories holding workspace packages, relative to the worktree root — `packages` for
   * a repository that has its own, nothing for one whose packages all come from submodules.
   * Missing directories are skipped, so a branch may add or drop one.
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
 * an agent could commit.
 *
 * Run once the whole tree is built rather than as each link is made: a `.bin` entry points
 * at a sibling package that may not have been linked yet, so a check made on the way past
 * would read it as dangling and repoint it at the primary — undoing exactly what copying
 * relative links verbatim is for.
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
    await fs.rm(link, { force: true });
    await fs.symlink(realpathSync(primaryPath), link);
  }

  return unrepaired;
}

/**
 * Directories holding a package.json under `directory`, relative to the worktree root.
 *
 * The walk carries on past a package it finds rather than stopping there, because pnpm's
 * `packages/**` glob matches a package nested inside another one. None of the repositories
 * using this has such a package today, which is exactly why a shallow scan would look
 * correct here — and would then quietly stop linking the first nested package somebody adds.
 */
async function findPackageDirectories(worktreeRoot: string, directory: string): Promise<string[]> {
  const directories: string[] = [];

  for (const entry of await fs.readdir(path.join(worktreeRoot, directory), { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'node_modules' || entry.name === 'dist') continue;
    const child = path.join(directory, entry.name);
    if (existsSync(path.join(worktreeRoot, child, 'package.json'))) directories.push(child);
    directories.push(...await findPackageDirectories(worktreeRoot, child));
  }

  return directories;
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
  let linked = 1;

  // The worktree's own packages drive this, not the primary checkout's: a package added on
  // the branch exists in neither the primary's tree nor its hoisted scope, and used to be
  // the one thing agents still had to link by hand. Resolving to the primary instead is
  // also what silently breaks a dev server that serves the worktree — a package reached
  // through a path outside that root renders as a blank element.
  for (const packageRoot of packageDirectories) {
    if (!existsSync(path.join(worktreeRoot, packageRoot))) continue;

    for (const packageDirectory of await findPackageDirectories(worktreeRoot, packageRoot)) {
      const nestedModules = path.join(primaryRoot, packageDirectory, 'node_modules');
      if (existsSync(nestedModules)) {
        // pnpm nests what it cannot hoist — a version conflict, and the workspace links
        // between sibling packages, which are relative and so follow the worktree's own
        // sources across.
        await materialize(nestedModules, path.join(worktreeRoot, packageDirectory, 'node_modules'), copiedLinks);
        linked++;
      }

      const { name } = JSON.parse(await fs.readFile(path.join(worktreeRoot, packageDirectory, 'package.json'), 'utf8'));
      const modulesRoot = path.join(worktreeRoot, 'node_modules');
      const scopedLink = typeof name === 'string' ? path.join(modulesRoot, name) : '';
      // `name` is whatever the branch being set up wrote in a package.json, and two lines
      // below it drives a recursive forced delete. `path.join` collapses `..`, so a name
      // spelled to climb out of the tree would aim that delete anywhere the user can write —
      // and a worktree is often somebody else's branch, checked out to review it. Contained
      // here rather than trusted, and the same check catches a package.json with no name at
      // all, which a stray fixture under `packageDirectories` can perfectly well be.
      if (!scopedLink.startsWith(modulesRoot + path.sep)) {
        throw new Error(`${packageDirectory}/package.json declares an unusable name (${JSON.stringify(name)}): the workspace link it asks for would land outside ${modulesRoot}.`);
      }
      await fs.mkdir(path.dirname(scopedLink), { recursive: true });
      await fs.rm(scopedLink, { recursive: true, force: true });
      await fs.symlink(path.relative(path.dirname(scopedLink), path.join(worktreeRoot, packageDirectory)), scopedLink);
    }
  }

  const unrepaired = await repairDanglingLinks(copiedLinks, worktreeRoot, primaryRoot);

  console.log(`Linked ${linked} node_modules ${linked === 1 ? 'directory' : 'directories'} from ${primaryRoot}.`);

  // Said out loud rather than left to the failure below, which only mentions these when
  // something else went wrong at the same time. Not a failure on its own: a link reaches
  // this list by dangling in the primary checkout too — a stale `.bin` entry pnpm left
  // behind, most of the time — so the worktree is no worse off than the tree it mirrors,
  // and failing over it would blame the branch for the state of the checkout beside it.
  // Worth a line all the same, because it is the answer when something later will not run.
  if (unrepaired.length > 0) {
    console.log(`${unrepaired.length} copied link(s) dangle here and in ${primaryRoot} too, so they were left alone.`);
  }

  const missingPackages = requiredPackages.filter(name => !existsSync(path.join(worktreeRoot, 'node_modules', name)));
  const danglingLinks = (await Promise.all(resolvedLinkDirectories.map(directory => danglingLinksIn(worktreeRoot, directory)))).flat();

  // Reported together when they happen together: they share a cause, and fixing where the
  // worktree lives fixes both at once.
  if (missingPackages.length > 0 || danglingLinks.length > 0) {
    const reasons: string[] = [];
    if (missingPackages.length > 0) {
      reasons.push(`Cannot resolve ${missingPackages.join(' or ')} from ${worktreeRoot}.`);
    }
    if (unrepaired.length > 0) {
      reasons.push(`${unrepaired.length} copied link(s) could not be pointed at the primary checkout either.`);
    }
    if (danglingLinks.length > 0) {
      reasons.push(`${danglingLinks.join(' and ')} dangle from here, and repairing node_modules does not repair the tracked links themselves.`);
    }
    // Where the worktree lives is the answer to a link that dangles, and only to that. Said
    // unconditionally it would send a reader whose package is merely not installed off to
    // move a worktree that was never in the wrong place — a confident wrong diagnosis, which
    // is worse than none at all and is exactly what this package exists to stop repeating.
    if (unrepaired.length > 0 || danglingLinks.length > 0) {
      reasons.push(`Links committed as \`../../<name>\` resolve only for a checkout sitting directly under ${path.dirname(primaryRoot)} — and this worktree is at ${worktreeRoot}. Create it there instead: \`git worktree add ${path.join(path.dirname(primaryRoot), '<name>')}\`.`);
    }
    throw new Error(reasons.join('\n'));
  }
}
