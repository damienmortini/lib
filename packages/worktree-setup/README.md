# @damienmortini/worktree-setup

Link a fresh git worktree against the primary checkout's installed dependencies.

A fresh worktree has no `node_modules` at all, so nothing resolves in it. `pnpm install`
is not the fix: these repositories reach their siblings through `submodules/*` symlinks, so
an install inside a worktree writes outside it and into the checkouts other agents are
working in. `setupWorktree` mirrors the primary checkout's `node_modules` instead — every
installed package symlinked across, scope directories and `.bin` recreated with their
original relative links, so workspace specifiers resolve to the worktree's own packages
rather than the primary's, including packages the branch adds.

`~/lib`, `~/damo`, `~/playground` and `~/graph` each carried their own copy of this, and the
copies drifted: a fix found in one had to be re-derived in the other three. This is the one
copy. What differs between the repositories is passed in, so the package itself stays dumb
about who is calling it.

## Why there is no `bin`

While the command runs from inside the worktree — which is what `npm run worktree:setup`
does, and what the `damo-worktree` skill documents — a `bin` cannot be the entry point: the
tree it would have to resolve through is the one this creates. So each repository keeps a
small `script/worktree-setup.ts` that finds the primary checkout with git and imports this
package from *its* `node_modules`. That bootstrap is the irreducible part; everything above
it lives here.

## Using it from a repository

`package.json`:

```json
{
  "scripts": { "worktree:setup": "node script/worktree-setup.ts" },
  "devDependencies": { "@damienmortini/worktree-setup": "workspace:*" }
}
```

`workspace:*` rather than a pinned version. This package is `private`, so it is never
published; a pinned `0.0.0` would stop matching the first time `lerna version` bumps it and
send `pnpm install` to the registry for a package that is not there. The workspace protocol
records a `link:submodules/lib/packages/worktree-setup` entry in the lockfile and keeps
doing so across bumps.

`script/worktree-setup.ts`:

```ts
import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// This worktree has no node_modules yet — creating it is the point — so the setup itself is
// resolved from the primary checkout, which does. `require.resolve` reads the package's
// `exports`, so the entry point stays the package's business rather than a path spelled out
// in four repositories.
//
// Anchored on this file rather than on the working directory, here and in the options
// below: run from another checkout, a cwd-derived root would resolve one repository's
// package and mirror its node_modules into another's.
const primaryRoot = realpathSync(execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: import.meta.dirname, encoding: 'utf8' })
  .split('\n')[0]
  .replace(/^worktree /, '')
  .trim());
const resolveFromPrimary = createRequire(path.join(primaryRoot, 'package.json'));
const { setupWorktree } = await import(pathToFileURL(resolveFromPrimary.resolve('@damienmortini/worktree-setup')).href) as typeof import('@damienmortini/worktree-setup');

try {
  await setupWorktree({
    directory: import.meta.dirname,
    packageDirectories: ['packages'],
    requiredPackages: ['@damienmortini/typescript-config', '@damienmortini/eslint-config'],
  });
  console.log('Worktree ready.');
}
catch (error) {
  // The failures here are diagnoses to read, not crashes: print the message and leave the
  // stack out of it.
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
```

A repository that already has a helper for part of that bootstrap should use it —
`damo/script/checkout.ts` exports the same `primaryCheckoutPath` this package does, and one
whose tree is already linked can import the pair from here instead of keeping its own.

## Options

Everything is off by default: each repository states what it needs, and the package assumes
nothing about who is calling it. `WorktreeSetupOptions` in `src/index.ts` documents what
each one is for and why.

| Option | |
| --- | --- |
| `directory` | A directory inside the worktree to set up. Defaults to `process.cwd()`. |
| `packageDirectories` | Where this repository's own workspace packages live, e.g. `['packages']`. |
| `requiredPackages` | Names that must resolve once the tree is linked. |
| `resolvedLinkDirectories` | Directories, e.g. `['submodules']`, whose committed symlinks must resolve. |

## What stays on the caller's side

The link tree is all this does. Anything a repository does with the tree afterwards is its
own, because the caller is the only side that knows what its flags mean:

```ts
// damo, whose packages resolve each other through a `dist` a fresh worktree does not have.
// `--no-build` stops after the link tree — seconds, not minutes; enough for eslint, which
// reads source.
const { values: { build } } = parseArgs({ allowNegative: true, options: { build: { type: 'boolean', default: true } } });

await setupWorktree({ /* … */ });

if (!build) {
  console.log('Skipped the build (--no-build): eslint is ready, running the code is not. Re-run without the flag to build.');
  process.exit(0);
}
console.log('Building workspace packages, this takes a couple of minutes…');
execFileSync('pnpm', ['run', 'build'], { cwd: worktreeRoot, stdio: ['ignore', 'ignore', 'inherit'] });
console.log('Worktree ready.');
```

`setupWorktree` logs what it linked and throws with the whole diagnosis when the tree it
built cannot resolve what the caller said it needs. A wrong success is worse than a clear
failure: reporting a worktree ready when it cannot run its own gates is what sends the next
reader looking for what their branch had broken.
