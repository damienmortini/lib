// Link this worktree against the primary checkout's installed dependencies. The work lives
// in `@damienmortini/worktree-setup`, shared with the repositories that used to carry their
// own copy of it; this states what lib needs and nothing else.
//
// Imported by path rather than by name, unlike the consumer repositories: the package is in
// this repository, so a worktree runs the copy on its own branch — which is what makes a
// change to it testable from a worktree at all. Resolving through node_modules here would
// run the primary checkout's copy instead.

import { setupWorktree } from '../packages/worktree-setup/src/index.ts';

try {
  await setupWorktree({
    // The worktree this file is in, not whichever checkout the shell happens to sit in: run
    // from elsewhere, a cwd-derived root would mirror one repository's node_modules into
    // another's.
    directory: import.meta.dirname,
    packageDirectories: ['packages'],
    // Both gates resolve through these: `eslint .` extends the config package, and every
    // package's `tsc` build extends the TypeScript one. Neither says so when it is missing.
    requiredPackages: ['@damienmortini/eslint-config', '@damienmortini/typescript-config'],
  });
  // lib's packages are read from source by everything that runs here, so the link tree is
  // the whole of "ready" — the repositories that need `pnpm run build` first run it here.
  console.log('Worktree ready.');
}
catch (error) {
  // The failures here are diagnoses to read, not crashes: print the message and leave the
  // stack out of it.
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
