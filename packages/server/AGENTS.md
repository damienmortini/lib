# @damienmortini/server — agent notes

What the server does — [TypeScript served from `src/` behind the `dist/` URL][source]
and the [injected import map][import-map] that lets browser code import installed
packages by bare name — is documented in [README.md](./README.md), along with every
CLI flag. Read it there; do not restate it here. The implementation lives in
`src/server.ts` (request pipeline) and `src/module-resolution.ts` (resolution,
import-map generation, dist→src mapping).

## Working on code this server serves

- **Never run a build to see a source change in the browser.** Edit the `.ts`
  source and reload the page.
- **Leave HTML pointing at the built `dist/` path.** That is deliberate, not a
  bug to fix — the rewrite is keyed on it.
- Run the server with `--resolve-modules`, or bare (`@scope/pkg`) imports will
  not resolve in the browser.

## Run

```
node packages/server/src/bin/index.ts --resolve-modules --port <port>
```

Run the bin's TypeScript entry point directly like this rather than `npx server`:
the published bin points at `dist/bin/index.js`, which is not built in this
checkout.

[source]: ./README.md#typescript-served-from-source-no-build-step
[import-map]: ./README.md#bare-specifiers-in-the-browser---resolve-modules
