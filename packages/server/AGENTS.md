# @damienmortini/server — agent notes

## No build step needed — the server transpiles TypeScript on the fly

This dev server serves TypeScript source as browser-ready JavaScript at request
time. **Do not run a build to see source changes in the browser.**

How it works (`src/server.ts`):

- A request for `<package>/dist/<path>.js` is resolved to `<package>/src/<path>.ts`.
  When that source file exists it is served instead of the built file — the
  source always wins, so a stale `dist/` on disk is never served.
- The `.ts` source has its types stripped with `node:module`'s
  `stripTypeScriptTypes`, then (with `--resolve-modules`) its import specifiers
  are rewritten so the browser can resolve them.
- Bare specifiers whose build output is missing are resolved through the
  package's `package.json`, so an unbuilt dependency still serves.

Practical consequences:

- HTML can keep pointing `<script src=".../dist/element/index.js">` at the built
  path. That is intentional and works without ever running a build — the server
  serves the live `src/element/index.ts`.
- Edit `src/*.ts` and reload; there is no build to run and no `dist/` to refresh.
- Run the server with `--resolve-modules` so relative (`./x.js`) and bare
  (`@scope/pkg`) imports are rewritten for the browser.

## Run

```
node packages/server/src/bin/index.ts --resolve-modules --port <port> [--proxy /path http://target] [--auth user:pass]
```

The server is HTTP/2 with live reload (`watch` is always on).
