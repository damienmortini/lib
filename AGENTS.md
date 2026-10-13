# @damienmortini/lib — agent notes

## Publish

Nothing publishes from CI. A release is run by hand, on request, while the maintainer is
there to approve it with their npm two-factor authentication. **Never store an npm token**:
not as a repository secret, not in an environment variable, and not in the user `.npmrc`
beyond the session below.

Every pull request that changes a published package bumps its version (the `Version bump`
workflow enforces it), so a release is whatever on `main` is ahead of npm.
`pnpm -r publish` publishes exactly the packages whose version the registry does not have
yet, and rewrites `workspace:*` dependencies to real versions — `npm publish` would ship
them literally, and `lerna publish` cannot prompt for a one-time password outside a
terminal.

1. Build exactly what is on `main`, in a fresh detached worktree:

   ```sh
   git fetch origin
   git worktree add --detach ../lib-release origin/HEAD
   cd ../lib-release
   node packages/worktree-setup/src/cli.ts .
   pnpm run build
   ```

2. List what will ship, and show the maintainer:

   ```sh
   pnpm -r publish --dry-run --no-git-checks
   ```

   `--no-git-checks` because a detached worktree is on no branch; it is clean by
   construction.

3. The maintainer runs `npm login`. It opens a web login and writes a two-hour session token
   to the user `.npmrc` (`npm config get userconfig`).

4. Publish, with the output readable while it waits (run it in the background):

   ```sh
   pnpm -r publish --no-git-checks
   ```

   When the registry asks for two-factor authentication, pnpm prints an approval URL and
   waits. Pass each URL to the maintainer as it appears; it opens on a phone.

5. Log out **immediately**, whether the publish succeeded or not, and check the token is
   gone:

   ```sh
   npm logout
   npm whoami                  # must fail
   grep _authToken "$(npm config get userconfig)"  # must print nothing
   ```

6. Confirm the release: the dry run from step 2 now lists nothing. Then remove the worktree
   with `git worktree remove ../lib-release`.
