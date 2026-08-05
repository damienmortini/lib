# @damienmortini/server

Simple live reloading HTTP2 server for development

`npx server [--path <path>] [--watch <path>] [--resolve-modules] [--verbose]`

## Bare specifiers in the browser (`--resolve-modules`)

With `--resolve-modules`, every served HTML page gets a generated
`<script type="importmap">` injected at the top of its `<head>`. **Browser code
can import installed packages by bare name, exactly like Node** — there is no
need to fetch a `package.json` and compute a path by hand:

```js
import { Signal } from '@damienmortini/signal';

const module = await import(`@damo/${name}-element/demo`); // computed names and subpaths too
```

### What gets an entry

The server crawls the page's module graph — the `<script type="module">` tags
and their imports, transitively — and adds:

- **One entry per bare specifier the crawl reached**, pointing at the canonical
  served URL of that module. Each specifier is resolved from the importing
  module's own location (Node semantics, so pnpm-style nested `node_modules`
  work), and symlinks are collapsed so a package reached through different
  links still maps to a single URL — browsers deduplicate modules by URL. A
  link pointing *outside* the served root (a submodule linked to a sibling
  checkout) is left as-is, since there is no in-root path to collapse it onto,
  so two such links to the same package do stay distinct URLs. When
  the same specifier resolves differently depending on the importer, the odd
  ones out get a `scopes` entry keyed on the importer's directory.
- **One entry per installed package name**, for every package found along the
  `node_modules` chains of the crawled modules. Import maps have no fallback
  for unmapped bare specifiers, so a name the crawl never reached would throw
  before any network request. Those names map to the reserved
  `/@resolve/<name>` route instead of a file, which keeps them lazy.
- **One trailing-slash prefix entry per installed package** (`<name>/` →
  `/@resolve/<name>/`), so subpath imports (`@damo/number-input-element/demo`)
  resolve as well.

`/@resolve/<specifier>` resolves the specifier server-side **at import time**
— relative to the importing page, taken from the `Referer` — and answers with a
small re-export shim pointing at the canonical served URL (re-exporting the
default too when the target declares one). That is what makes a *computed*
`import('@damo/' + name)` work: the browser only needs the name to be a map
key, and the actual resolution happens on the request.

Static bare imports inside served module bodies are rewritten to resolved URLs
server-side rather than left to the map, so module Workers — which never
receive the page's import map — resolve their dependencies too.

### Interaction with the `dist/` → `src/` rewrite

Map entries point at each package's **published** entry point (typically
`dist/….js`), which is also what the browser requests. A request under `/dist/`
is served from the sibling `/src/` file (`.js` → `.ts`), transpiled on the fly,
whenever that source exists — so the URLs in the map stay stable while the code
behind them is always the live source. A package whose `dist/` has never been
built still gets a map entry: when Node resolution fails because the target
file is absent, the specifier is resolved through the package's `package.json`
without an existence check, and the request is then answered from `src/`.

### Limits

- Resolution anchors on the server's working directory, so run the server from
  the root it serves (it warns when `--root` points elsewhere).
- A module reached *only* through `/@resolve/` was never crawled, so package
  names visible solely from that module's own non-hoisted `node_modules` are
  not enumerated.
- A specifier that cannot be resolved is left out of the map on purpose, so the
  browser's error names the real specifier. The server logs it too.
- The generated map is injected first, and a document's import maps merge in
  order with the earlier map winning on a conflicting key, so a page's own
  hand-authored `<script type="importmap">` cannot override a generated entry.
  Prefer deleting it and relying on the generated one.

## Opting out of automatic reloads

Before reloading on a file change or reconnect, the injected live-reload client
dispatches a cancelable `server:livereload` event
(`CustomEvent<{ reason: 'change' | 'reconnect' }>`) on `window`. Call
`event.preventDefault()` to take over the update yourself — for example to show
a manual refresh control instead of reloading the page:

```js
window.addEventListener('server:livereload', (event) => {
  event.preventDefault();
  showRefreshButton();
});
```
