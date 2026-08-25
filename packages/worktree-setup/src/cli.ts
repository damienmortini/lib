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

import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { currentCheckoutPath, setupWorktree, type WorktreeSetupOptions } from './index.ts';

interface PackageManifest {
  devDependencies?: Record<string, unknown>;
  scripts?: Record<string, unknown>;
  worktreeSetup?: unknown;
}

// Everything a repository declares — every option except `directory`, the path this command is
// handed. A record keyed by the interface rather than a list beside it, because `Record` has to
// be exhaustive in both directions: dropping or renaming an option in `WorktreeSetupOptions`
// leaves a key here that no longer belongs, and *adding* one leaves a key missing. Either way
// this stops compiling, which is the point — a list would accept the addition happily and leave
// the CLI rejecting a legitimate option at runtime as one it has never heard of.
type OptionName = keyof Omit<WorktreeSetupOptions, 'directory'>;

const DECLARED_OPTIONS = { packageDirectories: true, requiredPackages: true, resolvedLinkDirectories: true } satisfies Record<OptionName, true>;

function isOptionName(name: string): name is OptionName {
  return name in DECLARED_OPTIONS;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(entry => typeof entry === 'string');
}

function readManifest(manifestPath: string): PackageManifest {
  try {
    return JSON.parse(readFileSync(manifestPath, 'utf8')) as PackageManifest;
  }
  catch (error) {
    // Named, because the raw message does not name it: a syntax error reports a position in a
    // file it never mentions, which reads as this command being broken rather than the
    // manifest it was pointed at.
    throw new Error(`Cannot read ${manifestPath}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
  }
}

/**
 * The `worktreeSetup` key of the worktree's own package.json, checked rather than trusted.
 *
 * A name this does not know is refused instead of ignored: a repository states what it needs
 * here and nowhere else now, so a mistyped `packageDirectory` would silently ask for nothing
 * and report a worktree ready that cannot run its own gates — the confident wrong success
 * this package exists to stop repeating.
 */
function readOptions(declared: unknown, manifestPath: string): WorktreeSetupOptions {
  if (declared === undefined) return {};
  if (typeof declared !== 'object' || declared === null || Array.isArray(declared)) {
    throw new Error(`\`worktreeSetup\` in ${manifestPath} must be an object naming this repository's options.`);
  }

  const options: WorktreeSetupOptions = {};

  for (const [name, value] of Object.entries(declared as Record<string, unknown>)) {
    if (!isOptionName(name)) {
      throw new Error(`\`worktreeSetup.${name}\` in ${manifestPath} is not an option — expected ${Object.keys(DECLARED_OPTIONS).join(', ')}.`);
    }
    if (!isStringArray(value)) {
      throw new Error(`\`worktreeSetup.${name}\` in ${manifestPath} must be an array of strings.`);
    }
    options[name] = value;
  }

  return options;
}

function checkAdoption(repositoryRoot: string): void {
  const manifestPath = path.join(repositoryRoot, 'package.json');
  const manifest = readManifest(manifestPath);
  if (manifest.worktreeSetup === undefined) throw new Error(`\`worktreeSetup\` is missing from ${manifestPath}.`);
  readOptions(manifest.worktreeSetup, manifestPath);

  if (typeof manifest.devDependencies?.['@damienmortini/worktree-setup'] !== 'string') {
    throw new Error(`\`devDependencies.@damienmortini/worktree-setup\` is missing from ${manifestPath}.`);
  }
  if (typeof manifest.scripts?.['worktree:setup'] !== 'string') {
    throw new Error(`\`scripts.worktree:setup\` is missing from ${manifestPath}.`);
  }
}

try {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: { check: { type: 'boolean' } },
  });
  if (values.check) {
    if (positionals.length > 0) throw new Error('`--check` reads the repository it is run in and takes no worktree path.');
    checkAdoption(currentCheckoutPath(process.cwd()));
    process.exit(0);
  }

  if (positionals.length > 1) {
    throw new Error(`Expected one worktree path, got ${positionals.length}: ${positionals.join(' ')}.`);
  }

  // Defaults to the working directory, so the command still works run from inside a worktree
  // by a repository that keeps its own copy of this package, as lib does.
  const directory = positionals[0] ?? process.cwd();
  // Both answered here rather than left to git, which is handed this as a `cwd` and reports a
  // bare ENOENT or ENOTDIR naming neither the path nor what was expected of it.
  const directoryStatus = statSync(directory, { throwIfNoEntry: false });
  if (!directoryStatus) throw new Error(`${path.resolve(directory)} does not exist.`);
  if (!directoryStatus.isDirectory()) {
    throw new Error(`${path.resolve(directory)} is not a directory — this takes the worktree to set up, or a directory inside it.`);
  }

  const worktreeRoot = currentCheckoutPath(directory);
  const manifestPath = path.join(worktreeRoot, 'package.json');
  await setupWorktree({ ...readOptions(readManifest(manifestPath).worktreeSetup, manifestPath), directory: worktreeRoot });

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
