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

## Driven from the primary checkout

```sh
~/graph/node_modules/.bin/worktree-setup ~/graph-todo-42-something
```

From the primary checkout, against a worktree path — that direction is the whole design. Run
from *inside* the worktree instead, the command would have to resolve through the tree it is
there to create, so it could not be a `bin`: each repository kept a `script/worktree-setup.ts`
that climbed back to the primary with `git worktree list` and `createRequire` before it could
import this package at all. (Executed rather than passed to `node`, because what `pnpm`
installs under `.bin` is a shell wrapper that runs `node` on the entry point itself.)

That climb is what did not work at the moment a repository adopted this. It resolves the
package from the primary's `node_modules`, but the devDependency putting it there lands on
the *adopting branch* — so the first worktree cut from that branch could not set itself up:
the primary was still on `main`, had no such devDependency, and `require.resolve` threw
before `setupWorktree` was ever reached. Adopting it in `~/graph` meant hand-creating
`node_modules/@damienmortini/worktree-setup` there to verify the change at all, which is the
hand-linking this package exists to abolish. The same held after every merge until somebody
ran `pnpm install` in the primary, and for any branch that bumped the package.

`setupWorktree` always took a `directory`, so none of that was necessary. Driven from the
primary, the tree the command resolves through is the installed one that is already there,
and the options come from the worktree — read as data out of its `package.json`, since code
would have to be imported out of the very tree this creates.

What the bin does not dissolve is the *first* adoption. `.bin/worktree-setup` is put there by
`pnpm install`, so a primary that has never installed this package — one adopting it, whose
branch is the only place the devDependency exists yet — still says `command not found`, and
still will until that branch merges and an install runs. That is once per repository, where
it used to be once per branch; but "once" is not "never", and the one time it bites is the
time the repository is new to this.

Run the package's own source by path for that one worktree. `src/cli.ts` imports nothing but
`node:` builtins and its own module, so it needs nothing installed anywhere, in any checkout:

```sh
node ~/lib/packages/worktree-setup/src/cli.ts ~/graph-todo-42-something
```

After that branch merges and the primary has installed once, the bin is there for every
branch after it — including one that changes its own setup, which changes only data the
worktree already carries.

## Using it from a repository

`package.json`:

```json
{
  "devDependencies": { "@damienmortini/worktree-setup": "workspace:*" },
  "worktreeSetup": {
    "packageDirectories": ["packages"],
    "requiredPackages": ["@damienmortini/typescript-config", "@damienmortini/eslint-config"]
  }
}
```

That is the whole adoption — the options this repository needs, and nothing else. A name the
`worktreeSetup` key does not know is refused rather than ignored, because a repository states
what it needs here and nowhere else now: a mistyped `packageDirectory` that silently asked for
nothing would report a worktree ready that cannot run its own gates. JSON carries no comments,
so a repository whose choice needs explaining — including the choice *not* to set an option —
records that wherever it documents itself.

`workspace:*` rather than a pinned version. This package is `private`, so it is never
published; a pinned `0.0.0` would stop matching the first time `lerna version` bumps it and
send `pnpm install` to the registry for a package that is not there. The workspace protocol
records a `link:submodules/lib/packages/worktree-setup` entry in the lockfile and keeps
doing so across bumps.

The repository that *owns* this package — `~/lib` — is the one exception to running the
installed copy. Resolving through `node_modules` there would run the primary checkout's copy,
so a change to this package could never be tested from a worktree of it. It runs its own
source by path instead, which needs nothing installed anywhere:

```sh
node ~/lib-todo-42-something/packages/worktree-setup/src/cli.ts ~/lib-todo-42-something
```

## Verifying a change against an adopter

The same form points an *adopter's* setup at an unmerged copy, which is the only way to try a
change where a wrong verdict about submodules or link trees actually bites. `~/damo`'s
`node_modules/.bin/worktree-setup` resolves through `submodules/lib` to the primary checkout, so
it always runs `main`; hand `node` the branch's `cli.ts` instead and point it at a worktree of
the adopter:

```sh
node ~/lib-todo-42-something/packages/worktree-setup/src/cli.ts ~/damo-todo-7-other
```

That bypasses nothing. The installed `.bin/worktree-setup` is a symlink to this same `src/cli.ts`,
and an adopter contributes no code — only the `worktreeSetup` data read out of the worktree being
set up — so the two runs differ in nothing but which file `node` was handed. Repeat it against a
worktree of each adopter and the branch has been tried against all four real repositories.

## Options

`directory` is the path the command is handed, defaulting to the working directory. The rest
are the `worktreeSetup` key's, each an array of strings. Everything is off by default: each
repository states what it needs, and the package assumes nothing about who is calling it.
`WorktreeSetupOptions` in `src/index.ts` documents what each one is for and why.

| Option | |
| --- | --- |
| `packageDirectories` | Where this repository's own workspace packages live, e.g. `['packages']`. |
| `requiredPackages` | Names that must resolve once the tree is linked. |
| `resolvedLinkDirectories` | Directories, e.g. `['submodules']`, whose committed symlinks must resolve. |

## What stays on the caller's side

The link tree is all this does. Anything a repository does with the tree afterwards is its
own, because the caller is the only side that knows what its flags mean — which is also why
the command stops on the count it linked rather than announcing a worktree ready:

```ts
// damo, whose packages resolve each other through a `dist` a fresh worktree does not have.
// Run after the bin, so the link tree it needs is already there and it can import normally.
// `--no-build` stops before the build — seconds, not minutes; enough for eslint, which reads
// source.
const { values: { build } } = parseArgs({ allowNegative: true, options: { build: { type: 'boolean', default: true } } });
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
