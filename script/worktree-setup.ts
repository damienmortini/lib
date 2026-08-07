// A fresh git worktree has no node_modules at all, so nothing resolves in it — not a
// workspace package, not a third-party dependency, not a local binary. `pnpm install`
// would fix that, but it re-runs every postinstall build and rewrites the lockfile for a
// checkout that is usually thrown away within the hour; this mirrors the primary
// checkout's node_modules in about a second instead. Every installed package is symlinked
// across, while scope directories (`@damienmortini`, `@types`, …) and `.bin` are recreated
// with their original relative links, so workspace specifiers resolve to the worktree's
// own packages rather than the primary checkout's.
//
// The link tree covers everything that reads source directly: eslint across the repo, and
// a package's own tests and typecheck — `packages/server` runs both off `src`. A sibling
// imported by name resolves to its `dist`, which a fresh worktree has not built, so
// typechecking or running code that crosses package boundaries needs `pnpm run build`
// first. Run this from inside the worktree.

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

// Both roots are resolved before anything compares them: `git rev-parse` resolves symlinks
// while `git worktree list` echoes each path as it was registered, and one directory
// spelled two ways would clear the guard below as "this is a linked worktree" — pointing
// the mirroring at the primary's own node_modules, which materialize deletes before it
// reads. That directory is shared with every other worktree and costs a full install.
const worktreeRoot = await fs.realpath(execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim());
// git lists the main worktree — the one holding the installed node_modules — first.
const primaryRoot = await fs.realpath(execFileSync('git', ['worktree', 'list', '--porcelain'], { encoding: 'utf8' })
  .split('\n')[0]
  .replace(/^worktree /, '')
  .trim());

if (worktreeRoot === primaryRoot) {
  console.error(`${worktreeRoot} is the primary checkout — run this from inside a linked worktree (its node_modules comes from \`pnpm install\`).`);
  process.exit(1);
}

/**
 * Recreate `source` at `target` as a tree of symlinks: relative links are copied
 * verbatim so they resolve inside the worktree, everything else points at the primary.
 * Removing `target` first keeps re-runs idempotent.
 */
async function materialize(source: string, target: string): Promise<void> {
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
    }
    else if (entry.isDirectory() && (entry.name.startsWith('@') || entry.name === '.bin')) {
      await materialize(sourcePath, targetPath);
    }
    else {
      await fs.symlink(sourcePath, targetPath);
    }
  }
}

/**
 * node_modules directories nested under `directory`, relative to the primary checkout.
 * Never descends into one: a match found deeper inside would be materialized through a
 * symlink and write into the primary checkout.
 */
async function nestedModulesDirectories(directory: string): Promise<string[]> {
  const directories: string[] = [];

  for (const entry of await fs.readdir(path.join(primaryRoot, directory), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const child = path.join(directory, entry.name);
    if (entry.name === 'node_modules') directories.push(child);
    else directories.push(...await nestedModulesDirectories(child));
  }

  return directories;
}

await materialize(path.join(primaryRoot, 'node_modules'), path.join(worktreeRoot, 'node_modules'));

// pnpm nests what it cannot hoist — a version conflict, and the workspace links between
// sibling packages, which are relative and so follow the worktree's own sources across.
const nestedModules = (await nestedModulesDirectories('packages'))
  // A branch that deletes a package must not get its node_modules recreated underneath.
  .filter(directory => existsSync(path.join(worktreeRoot, path.dirname(directory))));

for (const directory of nestedModules) {
  await materialize(path.join(primaryRoot, directory), path.join(worktreeRoot, directory));
}

console.log(`Linked ${nestedModules.length + 1} node_modules directories from ${primaryRoot}. Worktree ready.`);
