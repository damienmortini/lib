#!/usr/bin/env node

// The command form of `setupWorktree`, run from the primary checkout against a worktree path
// — which is the only side of the pair that can run it. The worktree has no node_modules
// (creating it is the point), so nothing resolves there, and a repository's own script had to
// climb back to the primary with git and `createRequire` before it could import this package
// at all. That climb only worked once the primary had installed the devDependency naming it,
// and the devDependency lands on the adopting branch: the first worktree cut from that branch
// could not set itself up, and neither could one cut after any merge until somebody ran an
// install in the primary. Driven from the primary instead, the tree the bin resolves through
// is the installed one, and the chicken-and-egg is gone.
//
// What differs between repositories comes from the worktree's own package.json rather than
// from code, because code would have to be imported out of the tree this creates. That also
// means a branch changing its own options is read from the branch, which is where a package
// it adds is declared.

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { currentCheckoutPath, setupWorktree, type WorktreeSetupOptions } from './index.ts';

// Everything a repository declares — which is every option except `directory`, the path this
// command is handed. Taken from the interface rather than spelled out a second time, and the
// names below are checked against it, so renaming or dropping one there stops this from
// compiling instead of leaving the error text promising something the package no longer takes.
type OptionName = keyof Omit<WorktreeSetupOptions, 'directory'>;

const OPTION_NAMES = ['packageDirectories', 'requiredPackages', 'resolvedLinkDirectories'] as const satisfies readonly OptionName[];

function isOptionName(name: string): name is OptionName {
  return (OPTION_NAMES as readonly string[]).includes(name);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(entry => typeof entry === 'string');
}

/**
 * The `worktreeSetup` key of the worktree's own package.json, checked rather than trusted.
 *
 * A name this does not know is refused instead of ignored: a repository states what it needs
 * here and nowhere else now, so a mistyped `packageDirectory` would silently ask for nothing
 * and report a worktree ready that cannot run its own gates — the confident wrong success
 * this package exists to stop repeating.
 */
function readOptions(worktreeRoot: string): WorktreeSetupOptions {
  const manifestPath = path.join(worktreeRoot, 'package.json');
  const declared: unknown = JSON.parse(readFileSync(manifestPath, 'utf8')).worktreeSetup;

  if (declared === undefined) return {};
  if (typeof declared !== 'object' || declared === null || Array.isArray(declared)) {
    throw new Error(`\`worktreeSetup\` in ${manifestPath} must be an object naming this repository's options.`);
  }

  const options: WorktreeSetupOptions = {};

  for (const [name, value] of Object.entries(declared as Record<string, unknown>)) {
    if (!isOptionName(name)) {
      throw new Error(`\`worktreeSetup.${name}\` in ${manifestPath} is not an option — expected ${OPTION_NAMES.join(', ')}.`);
    }
    if (!isStringArray(value)) {
      throw new Error(`\`worktreeSetup.${name}\` in ${manifestPath} must be an array of strings.`);
    }
    options[name] = value;
  }

  return options;
}

try {
  // No options of its own: everything this takes is either the worktree it is pointed at or
  // something that worktree declares. An unknown `--flag` is refused here rather than read as
  // a path.
  const { positionals } = parseArgs({ allowPositionals: true });
  if (positionals.length > 1) {
    throw new Error(`Expected one worktree path, got ${positionals.length}: ${positionals.join(' ')}.`);
  }

  // Defaults to the working directory, so the command still works run from inside a worktree
  // by a repository that keeps its own copy of this package, as lib does.
  const directory = positionals[0] ?? process.cwd();
  if (!existsSync(directory)) throw new Error(`${path.resolve(directory)} does not exist.`);

  const worktreeRoot = currentCheckoutPath(directory);
  await setupWorktree({ ...readOptions(worktreeRoot), directory: worktreeRoot });

  // No `Worktree ready.` here. Announcing itself done is the caller's, the same way building
  // is: a repository whose packages resolve through a `dist` is not ready when this returns,
  // and saying so would be the wrong success. The count `setupWorktree` logs is the true one.
}
catch (error) {
  // The failures here are diagnoses to read, not crashes: print the message and leave the
  // stack out of it.
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
