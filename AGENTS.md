# @damienmortini/lib — agent notes

## Publish

Nothing publishes from CI. A release is run by hand, on request, while the maintainer is
there to approve it with their npm two-factor authentication. **Never store an npm token**:
not as a repository secret, not in an environment variable, and not in the user `.npmrc`.
The login below lives in a throwaway config file for the length of the release.

Every pull request that changes a published package bumps its version (the `Version bump`
workflow enforces it), so a release is whatever on `main` is ahead of npm.
`pnpm -r publish` publishes exactly the packages whose version the registry does not have
yet, rewrites `workspace:*` dependencies to real versions (`npm publish` would ship them
literally), and answers the registry's two-factor challenge with an approval URL instead of
a typed one-time password. Like `lerna publish`, it refuses that challenge without a
terminal, so an agent runs it under `script`, which gives it a pseudo-terminal.

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

3. Make a throwaway directory with `mktemp -d`, `<directory>` below. Every npm and pnpm
   command from here to the logout carries `NPM_CONFIG_USERCONFIG=<directory>/npmrc`, so
   the login never touches the user `.npmrc`. The maintainer logs in with it:

   ```sh
   NPM_CONFIG_USERCONFIG=<directory>/npmrc npm login
   ```

   `npm login` opens a web login and writes a two-hour session token to that file, out of
   reach of anything not given the variable.

4. Publish under a pseudo-terminal, in the background so its output can be read while it
   waits:

   ```sh
   NPM_CONFIG_USERCONFIG=<directory>/npmrc \
     script -qec 'pnpm -r publish --no-git-checks' /dev/null < /dev/null
   ```

   Each two-factor challenge prints an approval URL and waits up to five minutes. Pass each
   URL to the maintainer as it appears; it opens on a phone. If the run stops partway,
   rerun this step: it skips what already reached the registry.

5. Log out **immediately**, whether the publish succeeded or not, and check the token is
   gone:

   ```sh
   NPM_CONFIG_USERCONFIG=<directory>/npmrc npm logout
   NPM_CONFIG_USERCONFIG=<directory>/npmrc npm whoami   # must fail
   rm -r <directory>
   grep _authToken "$(npm config get userconfig)"       # must print nothing
   ```

6. Confirm the release: the dry run from step 2 now lists nothing. Then remove the worktree
   with `git worktree remove ../lib-release`.
