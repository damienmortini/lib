# @damienmortini/worktree-setup

Link a fresh git worktree against the primary checkout's installed dependencies.

A fresh worktree has no `node_modules` at all, so nothing resolves in it. `pnpm install` inside
it is not always the fix: a workspace that reaches sibling checkouts through committed
`submodules/*` symlinks writes *outside* the worktree when it installs, into the checkouts
other people are working in. `setupWorktree` mirrors the primary checkout's `node_modules`
instead — every installed package symlinked across, scope directories and `.bin` recreated with
their original relative links, so workspace specifiers resolve to the worktree's own packages
rather than the primary's, including packages the branch adds.

The branch's tree is what the result is measured against, not the primary's. Workspace members
come from the `packages` globs the worktree's own `pnpm-workspace.yaml` declares — including
ones reached through submodule symlinks — as well as from `packageDirectories`, and every
dependency declared by a manifest the worktree itself holds is verified to resolve from the
package declaring it: linked from the primary's install where the mirror alone did not carry
it, and refused loudly, naming the manifest and the name, where nothing can. (A member reached
through a submodule symlink is a sibling checkout's shared directory: it gets its scope link,
but its own dependencies are that repository's install to answer for, and nothing is ever
written inside it.) A dependency the primary checkout has never installed anywhere cannot be
linked from it, and reporting the tree ready anyway would be the wrong success — the failure
says so instead.

## Driven from the primary checkout

```sh
node_modules/.bin/worktree-setup ../my-app-feature
```

From the primary checkout, against a worktree path — that direction is the whole design. Run
from *inside* the worktree instead, the command would have to resolve through the tree it is
there to create, so it could not be a `bin`: a repository doing that needs its own script that
climbs back to the primary with `git worktree list` and `createRequire` before it can import
this package at all. (Executed rather than passed to `node`, because what `pnpm` installs under
`.bin` is a shell wrapper that runs `node` on the entry point itself.)

That climb is also what fails at the moment a repository adopts this. It resolves the package
from the primary's `node_modules`, but the devDependency putting it there lands on the
*adopting branch* — so the first worktree cut from that branch cannot set itself up: the
primary is still on the default branch, has no such devDependency, and `require.resolve` throws
before `setupWorktree` is ever reached.

`setupWorktree` always takes a `directory`, so none of that is necessary. Driven from the
primary, the tree the command resolves through is the installed one that is already there, and
the options come from the worktree — read as data out of its `package.json`, since code would
have to be imported out of the very tree this creates.

What the bin does not dissolve is the *first* adoption. `.bin/worktree-setup` is put there by
`pnpm install`, so a primary that has never installed this package — one adopting it, whose
branch is the only place the devDependency exists yet — still says `command not found`, and
still will until that branch merges and an install runs. That is once per repository, and the
one time it bites is the time the repository is new to this.

Run the package's own source by path for that one worktree. `src/cli.ts` imports nothing but
`node:` builtins and its own module, so it needs nothing installed anywhere, in any checkout:

```sh
node ../lib/packages/worktree-setup/src/cli.ts ../my-app-feature
```

After that branch merges and the primary has installed once, the bin is there for every branch
after it — including one that changes its own setup, which changes only data the worktree
already carries.

## Using it from a repository

`package.json`:

```json
{
  "devDependencies": { "@damienmortini/worktree-setup": "workspace:*" },
  "scripts": { "worktree:setup": "worktree-setup" },
  "worktreeSetup": {
    "packageDirectories": ["packages"],
    "requiredPackages": ["@my-scope/typescript-config", "@my-scope/eslint-config"]
  }
}
```

Three entries and a prose section: that is the whole adoption, and none of the four is
optional.

The `worktree:setup` script is the entry point the repository is asked for by name. Whoever
sets up a worktree reads `scripts` and runs `pnpm run worktree:setup <worktree-path>`; the bin
under `node_modules/.bin` is what that resolves to, not something a caller should have to know
is installed. The alias is also where a repository that runs this differently puts the
difference, so the entry point stays one name across all of them.

A name the `worktreeSetup` key does not know is refused rather than ignored, because a
repository states what it needs here and nowhere else: a mistyped `packageDirectory` that
silently asked for nothing would report a worktree ready that cannot run its own gates.

JSON carries no comments, so record the choices in prose, in the file the repository addresses
its own readers from — its `README.md`, or whatever that file is called. A section there says
why each option is set *and why an unset one is unset*: that a repository sets no
`resolvedLinkDirectories` because none of its gates resolves through a submodule, or no
`packageDirectories` because it owns no packages of its own. Without it the next reader finds an
absence, which reads the same whether it was decided or forgotten, and re-derives the answer or
changes it. The same section is where anything the repository does *on top of* the link tree
belongs — a build, say — because that step is the repository's, not this package's and not its
caller's.

`workspace:*` rather than a pinned version, for a repository that reaches this package through
a checkout rather than the registry. This package is `private`, so it is never published; a
pinned `0.0.0` would stop matching the first time the version is bumped and send `pnpm install`
to the registry for a package that is not there. The workspace protocol records a `link:` entry
in the lockfile and keeps doing so across bumps.

The repository that *owns* this package is the one exception to running the installed copy.
Resolving through `node_modules` there would run the primary checkout's copy, so a change to
this package could never be tested from a worktree of it. It runs its own source by path
instead, which needs nothing installed anywhere:

```sh
node ../lib-feature/packages/worktree-setup/src/cli.ts ../lib-feature
```

That is what its `worktree:setup` alias runs — `node packages/worktree-setup/src/cli.ts`, from
the worktree rather than from the primary, since the source to run is the branch's. The
exception lives in the alias, which is why the entry point is still the same name here.

## Checking an adoption

Run `worktree-setup --check` from a repository's root as part of its lint or test command. It
fails with the missing manifest entry when the repository has no `worktree:setup` script, no
`worktreeSetup` key, an unknown option, or no `@damienmortini/worktree-setup` devDependency.
The prose section remains a human-readable record of why the repository chose each option.

## Verifying a change against a consumer

The same form points a *consumer's* setup at an unmerged copy, which is the only way to try a
change where a wrong verdict about submodules or link trees actually bites. A consumer's
`node_modules/.bin/worktree-setup` resolves through its checkout of this package to the primary,
so it always runs the default branch; hand `node` the branch's `cli.ts` instead and point it at
a worktree of the consumer:

```sh
node ../lib-feature/packages/worktree-setup/src/cli.ts ../my-app-feature
```

That bypasses nothing. The installed `.bin/worktree-setup` runs this same `src/cli.ts`, and a
consumer contributes no code — only the `worktreeSetup` data read out of the worktree being set
up — so the two runs differ in nothing but which file `node` was handed. Repeat it against a
worktree of each consumer and the branch has been tried against every repository that uses it.

## Options

`directory` is the path the command is handed, defaulting to the working directory. The rest
are the `worktreeSetup` key's, each an array of strings. Everything is off by default: each
repository states what it needs, and the package assumes nothing about who is calling it.
`WorktreeSetupOptions` in `src/index.ts` documents what each one is for and why.

| Option | |
| --- | --- |
| `packageDirectories` | Where this repository's own workspace packages live, e.g. `['packages']` — on top of the `packages` globs its `pnpm-workspace.yaml` declares, which are always read. |
| `requiredPackages` | Names that must resolve once the tree is linked. |
| `resolvedLinkDirectories` | Directories, e.g. `['submodules']`, whose committed symlinks must resolve. |

## What stays on the caller's side

The link tree is all this does. Anything a repository does with the tree afterwards is its own,
because the caller is the only side that knows what its flags mean — which is also why the
command stops on the count it linked rather than announcing a worktree ready. A repository
whose packages resolve each other through a `dist` a fresh worktree does not have runs its
build after the bin returns, with the link tree it needs already in place, and decides for
itself whether a flag asked for that build to be skipped.

`setupWorktree` logs what it linked and throws with the whole diagnosis when the tree it built
cannot resolve what the caller said it needs. A wrong success is worse than a clear failure:
reporting a worktree ready when it cannot run its own gates is what sends the next reader
looking for what their branch had broken.
