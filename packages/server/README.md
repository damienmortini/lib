# @damienmortini/server

Simple live reloading HTTP2 server for development

`npx run server [--path=.] [--watchpath=.] [--verbose]`

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
