// The fixture both test files build on: a real primary checkout with a real linked worktree
// beside it. Shared rather than copied, because that is what this package is about — and a
// second copy of it would drift the same way the per-repository copies did.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after } from 'node:test';

const temporaryRoots: string[] = [];

after(async () => {
  for (const root of temporaryRoots) await fs.rm(root, { recursive: true, force: true });
});

function git(gitArguments: string[], directory: string): void {
  execFileSync('git', gitArguments, { cwd: directory, stdio: 'ignore' });
}

export async function write(filePath: string, contents: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents);
}

/**
 * A primary checkout with one commit and a linked worktree beside it, both under a
 * directory that is removed afterwards. Resolved, so the paths match what the setup reads
 * back from git on a platform where the temporary directory is itself a symlink.
 *
 * The primary's `node_modules` is part of the fixture because it is what every test needs:
 * it is the directory the setup mirrors, so a test that did not have one would not be
 * testing this package at all.
 */
export async function checkouts(): Promise<{ primaryRoot: string; worktreeRoot: string }> {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'worktree-setup-')));
  temporaryRoots.push(root);

  const primaryRoot = path.join(root, 'repository');
  await write(path.join(primaryRoot, 'package.json'), '{"name":"repository"}');
  git(['init', '--initial-branch=main'], primaryRoot);
  git(['add', '.'], primaryRoot);
  git(['-c', 'user.email=test@example.com', '-c', 'user.name=Test', 'commit', '-m', 'initial'], primaryRoot);

  const worktreeRoot = path.join(root, 'repository-worktree');
  git(['worktree', 'add', '-b', 'branch', worktreeRoot], primaryRoot);

  await fs.mkdir(path.join(primaryRoot, 'node_modules'), { recursive: true });

  return { primaryRoot, worktreeRoot };
}
