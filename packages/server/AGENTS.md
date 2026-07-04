# @damienmortini/server — agent notes

## No build step needed — the server transpiles TypeScript on the fly

This dev server serves TypeScript source as browser-ready JavaScript at request
time. **Do not run a build to see source changes in the browser.**

How it works (`src/server.ts` — request pipeline; `src/module-resolution.ts` —
resolution, import-map generation, dist→src mapping):

- A request for `<package>/dist/<path>.js` is resolved to `<package>/src/<path>.ts`.
  When that source file exists it is served instead of the built file — the
  source always wins, so a stale `dist/` on disk is never served.
- The `.ts` source has its types stripped with `node:module`'s
  `stripTypeScriptTypes` and served otherwise untouched — module bodies are
  never rewritten.
- With `--resolve-modules`, the server crawls each HTML page's module graph and
  injects a generated `<script type="importmap">`, so the browser resolves bare
  specifiers (`@scope/pkg`) itself. Each bare import is resolved from the
  importing module's own location (Node semantics, so pnpm-style nested
  node_modules work) and canonicalized so every package maps to exactly one
  URL — browsers deduplicate modules by URL. Bare specifiers whose build output
  is missing are resolved through the package's `package.json`, so an unbuilt
  dependency still maps and serves.
- The map also lists every installed package name (import maps have no
  fallback for unmapped bare specifiers); names the crawl did not reach point
  at the reserved `/@resolve/<specifier>` route, which resolves the specifier
  server-side **at import time** and answers with a re-export shim. That makes
  computed dynamic imports work — `import('@damo/' + name)` or any installed
  package name — while staying fully lazy.

Practical consequences:

- HTML can keep pointing `<script src=".../dist/element/index.js">` at the built
  path. That is intentional and works without ever running a build — the server
  serves the live `src/element/index.ts`.
- Edit `src/*.ts` and reload; there is no build to run and no `dist/` to refresh.
- Run the server with `--resolve-modules` so bare (`@scope/pkg`) imports work in
  the browser via the injected import map. Relative imports must carry real
  extensions (`./x.js`) — they are standard browser ESM and pass through as-is.

## Run

```
node packages/server/src/bin/index.ts --resolve-modules --port <port> [--proxy /path http://target] [--auth user:pass]
```

The server is HTTP/2 with live reload (`watch` is always on).
