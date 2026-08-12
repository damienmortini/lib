// Run as a command rather than imported, because the command is the subject: what it does
// with a path it is handed, what it refuses, and whether a failure leaves a diagnosis to read
// or a stack trace to decipher.

import assert from 'node:assert/strict';
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';

import { checkouts, write } from './test-checkouts.ts';

const cli = path.join(import.meta.dirname, 'cli.ts');

function run(cliArguments: string[], cwd?: string): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [cli, ...cliArguments], { cwd, encoding: 'utf8' });
}

/** Declare `worktreeSetup` on the worktree's own package.json, which is what the CLI reads. */
async function declareOptions(worktreeRoot: string, worktreeSetup: unknown): Promise<void> {
  await write(path.join(worktreeRoot, 'package.json'), JSON.stringify({ name: 'repository', worktreeSetup }));
}

test('reads the options the worktree declares, from the primary checkout', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();
  // Only the branch has this package — the case the options exist for — and only the branch's
  // package.json asks for `packages` to be linked. The primary's says nothing about either.
  await write(path.join(worktreeRoot, 'packages/added/package.json'), '{"name":"@scope/added"}');
  await declareOptions(worktreeRoot, { packageDirectories: ['packages'] });

  // Run from the primary checkout, which is the whole point: nothing had to resolve out of
  // the worktree for this to work.
  const { status, stdout } = run([worktreeRoot], primaryRoot);

  assert.equal(status, 0);
  assert.match(stdout, /Linked 1 node_modules directory/);
  assert.equal(
    await fs.realpath(path.join(worktreeRoot, 'node_modules/@scope/added')),
    path.join(worktreeRoot, 'packages/added'),
  );
});

test('mirrors the tree with no options at all, which a repository may legitimately want', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();
  await write(path.join(primaryRoot, 'node_modules/installed/index.js'), '');

  const { status } = run([worktreeRoot], primaryRoot);

  assert.equal(status, 0);
  assert.equal(existsSync(path.join(worktreeRoot, 'node_modules/installed')), true);
});

test('takes the working directory when handed no path, for a repository running its own copy', async () => {
  const { worktreeRoot } = await checkouts();

  const { status } = run([], worktreeRoot);

  assert.equal(status, 0);
  assert.equal(existsSync(path.join(worktreeRoot, 'node_modules')), true);
});

test('refuses a second path rather than silently setting up only the first', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();

  const { status, stderr } = run([worktreeRoot, worktreeRoot], primaryRoot);

  assert.equal(status, 1);
  assert.match(stderr, /Expected one worktree path, got 2/);
});

test('refuses an option name it does not know rather than silently asking for nothing', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();
  await declareOptions(worktreeRoot, { packageDirectory: ['packages'] });

  const { status, stderr } = run([worktreeRoot], primaryRoot);

  assert.equal(status, 1);
  assert.match(stderr, /`worktreeSetup.packageDirectory`.*is not an option/);
  assert.match(stderr, /packageDirectories/);
  // A diagnosis to read, not a crash to decipher.
  assert.doesNotMatch(stderr, /at .*cli\.ts/);
});

test('refuses an option that is not an array of strings', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();
  await declareOptions(worktreeRoot, { packageDirectories: 'packages' });

  const { status, stderr } = run([worktreeRoot], primaryRoot);

  assert.equal(status, 1);
  assert.match(stderr, /`worktreeSetup.packageDirectories`.*must be an array of strings/);
});

test('passes the setup its own diagnosis through, without a stack', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();
  await declareOptions(worktreeRoot, { requiredPackages: ['@scope/absent'] });

  const { status, stderr } = run([worktreeRoot], primaryRoot);

  assert.equal(status, 1);
  assert.match(stderr, /Cannot resolve @scope\/absent/);
  assert.doesNotMatch(stderr, /at .*index\.ts/);
});

test('names a path that is not there, rather than failing inside git', async () => {
  const { primaryRoot } = await checkouts();
  const absent = path.join(primaryRoot, 'no-such-worktree');

  const { status, stderr } = run([absent], primaryRoot);

  assert.equal(status, 1);
  assert.match(stderr, new RegExp(`${absent} does not exist`));
});

test('says a path is not a directory, which git would report as a bare ENOTDIR', async () => {
  const { primaryRoot } = await checkouts();
  const file = path.join(primaryRoot, 'package.json');

  const { status, stderr } = run([file], primaryRoot);

  assert.equal(status, 1);
  assert.match(stderr, new RegExp(`${file} is not a directory`));
  assert.doesNotMatch(stderr, /ENOTDIR/);
});
