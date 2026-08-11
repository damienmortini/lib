import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';

import { findIgnoreFiles } from './find-ignore-files.js';

/**
 * Build a throwaway directory tree under a fresh temporary root, removed when the test
 * ends. A path ending in `/` becomes a directory, anything else an empty file; missing
 * parent directories are created either way.
 * @param {import('node:test').TestContext} testContext Test the tree belongs to.
 * @param {string[]} paths Paths to create, relative to the temporary root.
 * @returns {string} Absolute path of the temporary root.
 */
function createTree(testContext, paths) {
  const root = mkdtempSync(join(tmpdir(), 'find-ignore-files-'));
  testContext.after(() => rmSync(root, { recursive: true, force: true }));
  for (const path of paths) {
    const absolutePath = join(root, path);
    if (path.endsWith('/')) {
      mkdirSync(absolutePath, { recursive: true });
    }
    else {
      mkdirSync(dirname(absolutePath), { recursive: true });
      writeFileSync(absolutePath, '');
    }
  }
  return root;
}

test('stacks every ignore file from the repository root down, outermost first', (testContext) => {
  const root = createTree(testContext, ['.git/', '.gitignore', 'packages/server/.gitignore']);

  assert.deepEqual(findIgnoreFiles(join(root, 'packages/server')), [
    join(root, '.gitignore'),
    join(root, 'packages/server/.gitignore'),
  ]);
});

test('keeps the repository ignore file for a package that has none of its own', (testContext) => {
  const root = createTree(testContext, ['.git/', '.gitignore', 'packages/core/']);

  assert.deepEqual(findIgnoreFiles(join(root, 'packages/core')), [join(root, '.gitignore')]);
});

test('stops at the repository root so a parent repository never leaks its patterns in', (testContext) => {
  const root = createTree(testContext, ['.gitignore', 'nested/.git/', 'nested/.gitignore', 'nested/src/']);

  assert.deepEqual(findIgnoreFiles(join(root, 'nested/src')), [join(root, 'nested/.gitignore')]);
});

test('stops at a linked worktree, whose `.git` is a file rather than a directory', (testContext) => {
  const root = createTree(testContext, ['.gitignore', 'worktree/.git', 'worktree/.gitignore', 'worktree/src/']);

  assert.deepEqual(findIgnoreFiles(join(root, 'worktree/src')), [join(root, 'worktree/.gitignore')]);
});

test('returns nothing when the repository has no ignore file, rather than throwing', (testContext) => {
  const root = createTree(testContext, ['.git/', 'src/']);

  assert.deepEqual(findIgnoreFiles(join(root, 'src')), []);
});
