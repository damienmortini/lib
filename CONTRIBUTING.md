# Contributing

## Setting up a worktree

A fresh worktree has to be linked against this checkout's installed dependencies, by
[`@damienmortini/worktree-setup`](packages/worktree-setup) — its README covers what it does
and what an adopting repository declares:

```sh
# from inside the fresh worktree, which has no node_modules to run anything through yet
node packages/worktree-setup/src/cli.ts .
```

That is what the `worktree:setup` script is — the same entry point every adopter declares,
pointed at this repository's own source rather than at the installed bin. This repository owns
the package, so the installed copy is the primary checkout's, and a change to it could never
be tested from a worktree of this repository. `src/cli.ts` imports nothing but `node:` builtins
and its own module, so running it by path needs nothing installed anywhere — which is also why
it is run from the worktree here, not from the primary as everywhere else.

The link tree is where the setup stops. Some packages here still resolve to `dist` rather than
to their source, so a change reaching across into one of those needs `pnpm run build` in the
worktree on top; a change staying inside one package, whose own tests run its `src`, does not.

No `resolvedLinkDirectories`: this repository has no `submodules/` at all — it is the one the
others link *to*. `packageDirectories: ["packages"]` is where its own workspace packages live,
and `requiredPackages` names the two configs every gate resolves through
(`@damienmortini/eslint-config` and `@damienmortini/typescript-config`), so a worktree that
cannot resolve them fails setup instead of failing `lint` later with a foreign error.

## TypeScript

Two compilers are installed side by side, which is why no `package.json` here names
`typescript` at a plain version:

```json
"@typescript/native": "npm:typescript@^7.0.2",
"typescript": "npm:@typescript/typescript6@^6.0.2"
```

`@typescript/native` is TypeScript 7 and owns the `tsc` that every `build` script and
`pnpm run typecheck` runs. The package *named* `typescript` is the TypeScript 6 compatibility
shim, kept only so that anything importing the compiler API has an API to import — TypeScript 7
ships none until 7.1, and without the shim `typescript-eslint` refuses to load and `eslint`
fails before linting a line. The shim's binary is `tsc6`, so the two never collide.

`syncpack` reads both aliases and reconciles the semver inside them, but `syncpack update`
skips aliased specifiers — `pnpm run upgrade` will never bump either one; move them by hand.

Delete both aliases and go back to a plain `typescript` at TypeScript 7.1, when the real
compiler API lands.
