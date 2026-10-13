# @damienmortini/lib — agent notes

## Publish

Nothing publishes from CI. A release is run by hand, on request, while the maintainer is
there to approve it with their npm two-factor authentication. **Never store an npm token**:
not as a repository secret, not in an environment variable, and not in the user `.npmrc`
beyond the one command below that logs in, publishes and logs out.

Every pull request that changes a published package bumps its version (the `Version bump`
workflow enforces it), so a release is whatever on `main` is ahead of npm.
`pnpm -r publish` publishes exactly the packages whose version the registry does not have
yet, rewrites `workspace:*` dependencies to real versions (`npm publish` would ship them
literally), and answers the registry's two-factor challenge with an approval URL instead of
a typed one-time password. Like `lerna publish`, it refuses that challenge without a
terminal, so an agent runs it under `script`, which gives it a pseudo-terminal — and runs
`npm login` the same way, so the maintainer only opens links.

1. Build exactly what is on `main`, in a fresh detached worktree:

   ```sh
   git fetch origin
   git worktree add --detach ../lib-release origin/HEAD
   cd ../lib-release
   node packages/worktree-setup/src/cli.ts .
   # The worktree builds with the primary checkout's install: it must match main.
   cmp pnpm-lock.yaml "$(git worktree list --porcelain | awk 'NR==1{print $2}')/node_modules/.pnpm/lock.yaml"
   pnpm run build
   git status --short   # must print nothing: the tarballs are what main holds
   ```

   When `cmp` reports a difference, run `pnpm install --frozen-lockfile` in the primary
   checkout first — never in the worktree, whose `node_modules` writes through to it.

2. List what will ship, and show the maintainer:

   ```sh
   pnpm -r publish --dry-run --no-git-checks
   ```

   `--no-git-checks` because a detached worktree is on no branch; step 1 checked it clean.

3. Log in, publish and log out in one invocation, in the background so its output can be
   read while it waits — the logout runs whether the publish succeeded or not:

   ```sh
   script -qec 'npm login' /dev/null < /dev/null
   script -qec 'pnpm -r publish --no-git-checks' /dev/null < /dev/null
   npm logout
   ```

   It prints two URLs, each waiting up to five minutes: the login, then one two-factor
   approval for the first package, which covers the rest of the batch. Pass each to the
   maintainer the moment it appears, saying it needs no reply; it opens on a phone. If the
   run stops partway, run this step again: it skips what already reached the registry.

4. Check the token is gone, even when step 3 was interrupted (then run `npm logout` first):

   ```sh
   npm whoami                                       # must fail
   grep _authToken "$(npm config get userconfig)"   # must print nothing
   ```

5. Confirm the release: the dry run from step 2 lists nothing once the registry catches up,
   which takes a few minutes. Then remove the worktree with `git worktree remove ../lib-release`.
