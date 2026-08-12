// Exercised against real git worktrees and real symlinks, because that is what the subject
// is: every interesting case here — a relative link that dangles once it is copied, a
// package only the branch has — is a fact about the filesystem, and a stubbed one would
// prove nothing about the tree these repositories actually get.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';

import { setupWorktree } from './index.ts';

const temporaryRoots: string[] = [];

after(async () => {
  for (const root of temporaryRoots) await fs.rm(root, { recursive: true, force: true });
});

function git(gitArguments: string[], directory: string): void {
  execFileSync('git', gitArguments, { cwd: directory, stdio: 'ignore' });
}

async function write(filePath: string, contents: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents);
}

/**
 * A primary checkout with one commit and a linked worktree beside it, both under a
 * directory that is removed afterwards. Resolved, so the paths match what the setup reads
 * back from git on a platform where the temporary directory is itself a symlink.
 */
async function checkouts(): Promise<{ primaryRoot: string; worktreeRoot: string }> {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'worktree-setup-')));
  temporaryRoots.push(root);

  const primaryRoot = path.join(root, 'repository');
  await write(path.join(primaryRoot, 'package.json'), '{"name":"repository"}');
  git(['init', '--initial-branch=main'], primaryRoot);
  git(['add', '.'], primaryRoot);
  git(['-c', 'user.email=test@example.com', '-c', 'user.name=Test', 'commit', '-m', 'initial'], primaryRoot);

  const worktreeRoot = path.join(root, 'repository-worktree');
  git(['worktree', 'add', '-b', 'branch', worktreeRoot], primaryRoot);

  return { primaryRoot, worktreeRoot };
}

test('mirrors the primary checkout, copying relative links and skipping pnpm bookkeeping', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();
  const modules = path.join(primaryRoot, 'node_modules');

  await write(path.join(modules, 'installed/index.js'), '');
  await write(path.join(modules, '.modules.yaml'), 'hoistPattern: []');
  await write(path.join(modules, '.pnpm/registry/index.js'), '');
  await write(path.join(primaryRoot, 'packages/local/index.js'), '');
  await fs.mkdir(path.join(modules, '@scope'), { recursive: true });
  await fs.symlink('../../packages/local', path.join(modules, '@scope/local'));
  await fs.mkdir(path.join(modules, '.bin'), { recursive: true });
  await fs.symlink('../@scope/local/index.js', path.join(modules, '.bin/local'));
  // The worktree has the branch's own copy of the package the relative links point at.
  await write(path.join(worktreeRoot, 'packages/local/index.js'), '');

  await setupWorktree({ directory: worktreeRoot });

  const worktreeModules = path.join(worktreeRoot, 'node_modules');
  assert.equal(await fs.readlink(path.join(worktreeModules, 'installed')), path.join(modules, 'installed'));
  // Copied verbatim, so it resolves to the worktree's own package rather than the primary's.
  assert.equal(await fs.readlink(path.join(worktreeModules, '@scope/local')), '../../packages/local');
  assert.equal(await fs.realpath(path.join(worktreeModules, '@scope/local')), path.join(worktreeRoot, 'packages/local'));
  assert.equal(await fs.readlink(path.join(worktreeModules, '.bin/local')), '../@scope/local/index.js');
  // Leaving these out is what keeps an install run here from writing back into the primary.
  assert.equal(existsSync(path.join(worktreeModules, '.modules.yaml')), false);
  assert.equal(existsSync(path.join(worktreeModules, '.pnpm')), false);
});

test('links a package the branch adds, which the primary checkout knows nothing about', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();

  await fs.mkdir(path.join(primaryRoot, 'node_modules'), { recursive: true });
  await write(path.join(worktreeRoot, 'packages/added/package.json'), '{"name":"@scope/added"}');
  // Nested where pnpm nests what it cannot hoist, and only in the primary.
  await write(path.join(primaryRoot, 'packages/added/node_modules/dependency/index.js'), '');

  await setupWorktree({ directory: worktreeRoot, packageDirectories: ['packages'] });

  assert.equal(
    await fs.realpath(path.join(worktreeRoot, 'node_modules/@scope/added')),
    path.join(worktreeRoot, 'packages/added'),
  );
  assert.equal(existsSync(path.join(worktreeRoot, 'packages/added/node_modules/dependency')), true);
});

test('points a copied link that dangles here at the primary checkout', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();

  // What `submodules/<name>` does in these repositories: a relative link out of the
  // checkout, resolving only for one sitting directly beside its target.
  await write(path.join(path.dirname(primaryRoot), 'sibling/packages/config/index.js'), '');
  await fs.mkdir(path.join(primaryRoot, 'submodules'), { recursive: true });
  await fs.symlink('../../sibling', path.join(primaryRoot, 'submodules/sibling'));
  await fs.mkdir(path.join(primaryRoot, 'node_modules/@scope'), { recursive: true });
  await fs.symlink('../../submodules/sibling/packages/config', path.join(primaryRoot, 'node_modules/@scope/config'));

  await setupWorktree({ directory: worktreeRoot, requiredPackages: ['@scope/config'] });

  // The worktree has no `submodules`, so the copied link dangled — and it names a directory
  // outside the checkout, which is the same real one either checkout reaches, so it was
  // repaired.
  assert.equal(
    await fs.realpath(path.join(worktreeRoot, 'node_modules/@scope/config')),
    path.join(path.dirname(primaryRoot), 'sibling/packages/config'),
  );
});

test('leaves a link dangling when the branch is what deleted the package it names', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();

  // Hoisted in the primary, which still has the package; the branch deleted `packages/gone`,
  // so its copy of the link dangles for a reason the primary checkout is not the answer to.
  await write(path.join(primaryRoot, 'packages/gone/index.js'), '');
  await fs.mkdir(path.join(primaryRoot, 'node_modules/@scope'), { recursive: true });
  await fs.symlink('../../packages/gone', path.join(primaryRoot, 'node_modules/@scope/gone'));
  // pnpm gives a workspace package a `.bin` entry through its hoisted link, so repointing
  // that one at the primary would resolve the deleted package's code just as well.
  await fs.mkdir(path.join(primaryRoot, 'node_modules/.bin'), { recursive: true });
  await fs.symlink('../@scope/gone/index.js', path.join(primaryRoot, 'node_modules/.bin/gone'));
  await fs.mkdir(path.join(worktreeRoot, 'packages'), { recursive: true });

  await setupWorktree({ directory: worktreeRoot });

  // Left exactly as it was copied, so it resolves to nothing rather than to the primary's.
  assert.equal(await fs.readlink(path.join(worktreeRoot, 'node_modules/@scope/gone')), '../../packages/gone');
  assert.equal(existsSync(path.join(worktreeRoot, 'node_modules/.bin/gone')), false);
});

test('reports a required package it cannot resolve, without blaming a link that did resolve', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();
  await fs.mkdir(path.join(primaryRoot, 'node_modules'), { recursive: true });

  await assert.rejects(
    setupWorktree({ directory: worktreeRoot, requiredPackages: ['@scope/absent'] }),
    (error: Error) => {
      assert.match(error.message, /Cannot resolve @scope\/absent/);
      // Nothing dangled, so where the worktree lives is not the answer: a package that is
      // simply not installed must not send a reader off to move a worktree.
      assert.doesNotMatch(error.message, /git worktree add/);
      assert.doesNotMatch(error.message, /could not be pointed at the primary checkout/);
      return true;
    },
  );
});

test('reports committed links that dangle, which repairing node_modules does not fix', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();
  await fs.mkdir(path.join(primaryRoot, 'node_modules'), { recursive: true });
  await fs.mkdir(path.join(worktreeRoot, 'submodules'), { recursive: true });
  await fs.symlink('../../sibling', path.join(worktreeRoot, 'submodules/sibling'));

  await assert.rejects(
    setupWorktree({ directory: worktreeRoot, resolvedLinkDirectories: ['submodules'] }),
    (error: Error) => {
      assert.match(error.message, /submodules\/sibling dangle from here/);
      // Here the location is the answer, so it is said — and says where.
      assert.match(error.message, new RegExp(`git worktree add ${path.join(path.dirname(primaryRoot), '<name>')}`));
      return true;
    },
  );
});

test('reports a copied link it could not repair, alongside what actually failed', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();

  // Dangles in the primary checkout as well — a stale `.bin` entry, the shape this list is
  // made of in practice — so there is nothing to point it at.
  await fs.mkdir(path.join(primaryRoot, 'node_modules/.bin'), { recursive: true });
  await fs.symlink('../removed/bin/removed.js', path.join(primaryRoot, 'node_modules/.bin/removed'));

  await assert.rejects(
    setupWorktree({ directory: worktreeRoot, requiredPackages: ['@scope/absent'] }),
    /1 copied link\(s\) could not be pointed at the primary checkout either/,
  );
});

test('refuses a package name that would point the delete outside node_modules', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();
  await fs.mkdir(path.join(primaryRoot, 'node_modules'), { recursive: true });

  const escapee = path.join(path.dirname(primaryRoot), 'do-not-delete-me');
  await write(path.join(escapee, 'kept.txt'), 'still here');
  await write(
    path.join(worktreeRoot, 'packages/malicious/package.json'),
    JSON.stringify({ name: `../../${path.basename(escapee)}` }),
  );

  await assert.rejects(
    setupWorktree({ directory: worktreeRoot, packageDirectories: ['packages'] }),
    /declares an unusable name/,
  );
  // The point of the guard: `fs.rm` never ran against it.
  assert.equal(existsSync(path.join(escapee, 'kept.txt')), true);
});

test('refuses to run in the primary checkout, whose node_modules it would delete', async () => {
  const { primaryRoot } = await checkouts();
  await fs.mkdir(path.join(primaryRoot, 'node_modules'), { recursive: true });

  await assert.rejects(setupWorktree({ directory: primaryRoot }), /is the primary checkout/);
  assert.equal(existsSync(path.join(primaryRoot, 'node_modules')), true);
});
