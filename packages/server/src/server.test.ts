import { ok, strictEqual } from 'node:assert';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { connect } from 'node:http2';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';

import { Server } from './server.ts';

async function fetchBody(port: number, path: string, requestHeaders: Record<string, string> = {}): Promise<string> {
  const session = connect(`https://localhost:${port}`, { rejectUnauthorized: false });
  try {
    return await new Promise<string>((resolvePromise, rejectPromise) => {
      session.on('error', rejectPromise);
      const stream = session.request({ ':path': path, ...requestHeaders });
      let body = '';
      stream.setEncoding('utf8');
      stream.on('data', (chunk: string) => {
        body += chunk;
      });
      stream.on('end', () => resolvePromise(body));
      stream.on('error', rejectPromise);
    });
  }
  finally {
    session.close();
  }
}

// Read the state token the live-reload stream sends on connect, then hang up —
// the stream itself stays open forever, so it can never be read to its end.
async function fetchLiveReloadState(port: number): Promise<string> {
  const session = connect(`https://localhost:${port}`, { rejectUnauthorized: false });
  try {
    return await new Promise<string>((resolvePromise, rejectPromise) => {
      session.on('error', rejectPromise);
      const stream = session.request({ ':path': '/@livereload' });
      let body = '';
      stream.setEncoding('utf8');
      stream.on('data', (chunk: string) => {
        body += chunk;
        const match = body.match(/event: state\ndata: (.*)\n/);
        if (match) resolvePromise(match[1]);
      });
      stream.on('error', rejectPromise);
    });
  }
  finally {
    session.close();
  }
}

async function fetchStatus(port: number, path: string): Promise<number> {
  const session = connect(`https://localhost:${port}`, { rejectUnauthorized: false });
  try {
    return await new Promise<number>((resolvePromise, rejectPromise) => {
      session.on('error', rejectPromise);
      const stream = session.request({ ':path': path });
      let status = 0;
      stream.on('response', (responseHeaders) => {
        status = Number(responseHeaders[':status']);
      });
      stream.on('data', () => {});
      stream.on('end', () => resolvePromise(status));
      stream.on('error', rejectPromise);
    });
  }
  finally {
    session.close();
  }
}

function boundPort(server: Server): number {
  const address = server.http2SecureServer.address();
  if (address === null || typeof address === 'string') throw new Error('server has no bound port');
  return address.port;
}

// Run the injected live-reload client against stubbed globals so the tests
// exercise its actual cancel contract, not just its source text. Node's native
// EventTarget/CustomEvent implement cancelable dispatch per spec, so no DOM
// library is needed.
function runInjectedClient(pageBody: string): { window: EventTarget; eventSource: EventTarget; reloadCount: () => number } {
  const scriptMatch = pageBody.match(/<script>([\s\S]*?)<\/script>/);
  ok(scriptMatch, 'expected an injected script in the served page');
  const windowStub = new EventTarget();
  let reloads = 0;
  const locationStub = { reload: () => reloads++ };
  const instances: EventTarget[] = [];
  class EventSourceStub extends EventTarget {
    constructor() {
      super();
      instances.push(this);
    }
  }
  new Function('window', 'location', 'EventSource', scriptMatch[1])(windowStub, locationStub, EventSourceStub);
  strictEqual(instances.length, 1, 'expected the client to open one EventSource');
  return { window: windowStub, eventSource: instances[0], reloadCount: () => reloads };
}

describe('live-reload client script', () => {
  let rootPath: string;
  let watchingServer: Server;
  let plainServer: Server;
  let watchingPage: string;

  before(async () => {
    rootPath = await mkdtemp(join(tmpdir(), 'server-test-'));
    await writeFile(join(rootPath, 'index.html'), '<html><head><title>test</title></head><body></body></html>');
    // The Server API has no ephemeral-port mode (get-port rejects ports below
    // 1024), so ask for high bases and let it scan upward from there when busy;
    // the actually-bound port is read back from the socket either way. The bases
    // sit more than one scan range (100 ports) apart so the two can never
    // collide on the same port.
    watchingServer = new Server({ rootPath, watch: true, port: 8801 });
    plainServer = new Server({ rootPath, watch: false, port: 9001 });
    await Promise.all([watchingServer.ready, plainServer.ready]);
    watchingPage = await fetchBody(boundPort(watchingServer), '/index.html');
  });

  after(async () => {
    await Promise.all([watchingServer.close(), plainServer.close()]);
    await rm(rootPath, { recursive: true, force: true });
  });

  it('reloads on a change message when nothing cancels the announcement', () => {
    const client = runInjectedClient(watchingPage);
    client.eventSource.dispatchEvent(new Event('message'));
    strictEqual(client.reloadCount(), 1);
  });

  it('skips the reload when a server:livereload listener prevents it', () => {
    const client = runInjectedClient(watchingPage);
    const reasons: unknown[] = [];
    client.window.addEventListener('server:livereload', (event) => {
      event.preventDefault();
      reasons.push((event as CustomEvent).detail.reason);
    });
    client.eventSource.dispatchEvent(new Event('message'));
    strictEqual(client.reloadCount(), 0, 'a prevented announcement must not reload');
    strictEqual(reasons[0], 'change');
  });

  it('stays quiet when a reconnect reaches the same server with nothing missed', () => {
    const client = runInjectedClient(watchingPage);
    const reasons: unknown[] = [];
    client.window.addEventListener('server:livereload', (event) => {
      event.preventDefault();
      reasons.push((event as CustomEvent).detail.reason);
    });
    client.eventSource.dispatchEvent(new MessageEvent('state', { data: 'server-1-0' }));
    client.eventSource.dispatchEvent(new MessageEvent('state', { data: 'server-1-0' }));
    strictEqual(reasons.length, 0, 'a dropped connection alone is not an update');
    strictEqual(client.reloadCount(), 0);
  });

  it('announces a reconnect when the state token moved on while it was away', () => {
    const client = runInjectedClient(watchingPage);
    const reasons: unknown[] = [];
    client.window.addEventListener('server:livereload', (event) => {
      event.preventDefault();
      reasons.push((event as CustomEvent).detail.reason);
    });
    client.eventSource.dispatchEvent(new MessageEvent('state', { data: 'server-1-0' }));
    strictEqual(reasons.length, 0, 'the first connection is not a reconnect');
    client.eventSource.dispatchEvent(new MessageEvent('state', { data: 'server-2-0' }));
    strictEqual(reasons[0], 'reconnect');
    strictEqual(client.reloadCount(), 0);
  });

  it('changes its state token when it refreshes, but not between connections', async () => {
    const state = await fetchLiveReloadState(boundPort(watchingServer));
    strictEqual(await fetchLiveReloadState(boundPort(watchingServer)), state, 'reconnecting alone must not move the token');
    watchingServer.refresh();
    ok(await fetchLiveReloadState(boundPort(watchingServer)) !== state, 'a refresh must move the token');
  });

  it('injects nothing when watch is off', async () => {
    const body = await fetchBody(boundPort(plainServer), '/index.html');
    ok(!body.includes('EventSource'), 'expected no live-reload client without watch');
    ok(!body.includes('server:livereload'), 'expected no livereload event wiring without watch');
  });
});

describe('forwarded prefix', () => {
  let fixturePath: string;
  let server: Server;
  let basedServer: Server;

  before(async () => {
    fixturePath = await mkdtemp(join(tmpdir(), 'server-test-fixture-'));
    await mkdir(join(fixturePath, 'node_modules', 'demo-package'), { recursive: true });
    await writeFile(join(fixturePath, 'node_modules', 'demo-package', 'package.json'), '{"name":"demo-package","main":"index.js"}');
    await writeFile(join(fixturePath, 'node_modules', 'demo-package', 'index.js'), 'export const demo = true;');
    // A package whose `./sub` entry has no directory on disk, so requesting its
    // package.json exercises the synthesized one.
    await mkdir(join(fixturePath, 'node_modules', 'subpath-package'), { recursive: true });
    await writeFile(
      join(fixturePath, 'node_modules', 'subpath-package', 'package.json'),
      '{"name":"subpath-package","type":"module","exports":{"./sub":"./dist/sub.js"}}',
    );
    await writeFile(join(fixturePath, 'module.js'), 'import { demo } from \'demo-package\';\nconsole.log(demo);');
    await writeFile(join(fixturePath, 'index.html'), '<html><head><title>test</title></head><body></body></html>');
    server = new Server({ rootPath: fixturePath, watch: true, resolveModules: true, port: 9201 });
    basedServer = new Server({ rootPath: fixturePath, watch: true, base: 'mounted', port: 9401 });
    await Promise.all([server.ready, basedServer.ready]);
  });

  after(async () => {
    await Promise.all([server.close(), basedServer.close()]);
    await rm(fixturePath, { recursive: true, force: true });
  });

  it('strips the announced prefix from the request path and emits it in the live-reload path', async () => {
    const body = await fetchBody(boundPort(server), '/mounted/app/index.html', { 'x-forwarded-prefix': '/mounted/app' });
    ok(body.includes('<title>test</title>'), 'expected the page behind the prefix to be served');
    ok(body.includes('new EventSource("/mounted/app/@livereload")'), 'expected the live-reload path under the prefix');
  });

  it('serves unprefixed requests untouched when no prefix is announced', async () => {
    const body = await fetchBody(boundPort(server), '/index.html');
    ok(body.includes('new EventSource("/@livereload")'), 'expected the live-reload path at the origin root');
  });

  it('falls back to the configured base when the announced prefix is not a plain path', async () => {
    for (const malformedPrefix of ['../../etc', '/mounted/../app', '/spaced value', `/${'a'.repeat(300)}`]) {
      const body = await fetchBody(boundPort(server), '/index.html', { 'x-forwarded-prefix': malformedPrefix });
      ok(body.includes('new EventSource("/@livereload")'), `expected the fallback to the origin root for ${JSON.stringify(malformedPrefix)}`);
    }
    const basedBody = await fetchBody(boundPort(basedServer), '/mounted/index.html', { 'x-forwarded-prefix': '../../etc' });
    ok(basedBody.includes('new EventSource("/mounted/@livereload")'), 'expected the fallback to land on the configured base prefix, not the origin root');
  });

  it('rewrites module specifiers under the announced prefix without poisoning the unprefixed variant', async () => {
    // The paths are rooted at the served root, not at the working directory the
    // test process happens to run from.
    const unprefixed = await fetchBody(boundPort(server), '/module.js');
    ok(unprefixed.includes('\'/node_modules/demo-package/index.js\''), `expected an unprefixed rewritten specifier, got: ${unprefixed}`);
    const prefixed = await fetchBody(boundPort(server), '/mounted/app/module.js', { 'x-forwarded-prefix': '/mounted/app' });
    ok(prefixed.includes('\'/mounted/app/node_modules/demo-package/index.js\''), `expected a rewritten specifier under the prefix, got: ${prefixed}`);
    const unprefixedAgain = await fetchBody(boundPort(server), '/module.js');
    strictEqual(unprefixedAgain, unprefixed, 'expected the prefixed variant to be cached separately');
  });

  it('synthesizes a package.json for a subpath export under a root outside the working directory', async () => {
    const body = await fetchBody(boundPort(server), '/node_modules/subpath-package/sub/package.json');
    strictEqual(JSON.parse(body).main, '../dist/sub.js');
  });
});

describe('directory listing', () => {
  let rootPath: string;
  let server: Server;

  before(async () => {
    rootPath = await mkdtemp(join(tmpdir(), 'server-listing-'));
    await writeFile(join(rootPath, 'video & clip.mp4'), 'binary');
    await mkdir(join(rootPath, '50% done'));
    await writeFile(join(rootPath, '50% done', 'report.txt'), 'report');
    await mkdir(join(rootPath, 'nested'));
    await writeFile(join(rootPath, 'nested', 'index.html'), '<html><body>nested index</body></html>');
    server = new Server({ rootPath, watch: false, port: 9301, directoryListing: true });
    await server.ready;
  });

  after(async () => {
    await server.close();
    await rm(rootPath, { recursive: true, force: true });
  });

  it('404s a directory with no index.html when listing is not enabled', async () => {
    const plainServer = new Server({ rootPath, watch: false, port: 9302 });
    await plainServer.ready;
    try {
      strictEqual(await fetchStatus(boundPort(plainServer), '/'), 404);
    }
    finally {
      await plainServer.close();
    }
  });

  it('lists a directory that has no index.html instead of failing on the missing file', async () => {
    const body = await fetchBody(boundPort(server), '/');
    ok(body.includes('href="/video%20%26%20clip.mp4"'), `expected an encoded entry link, got: ${body}`);
    ok(body.includes('video &amp; clip.mp4'), 'expected the entry name escaped for HTML');
    ok(body.includes('href="/nested/"'), 'expected subdirectories to link with a trailing slash');
  });

  it('encodes every path segment of an entry link, not just the entry name', async () => {
    const body = await fetchBody(boundPort(server), '/50%25%20done/');
    ok(body.includes('href="/50%25%20done/report.txt"'), `expected the ancestor directory name encoded too, got: ${body}`);
  });

  it('still serves index.html when the directory has one', async () => {
    const body = await fetchBody(boundPort(server), '/nested/');
    ok(body.includes('nested index'), `expected the directory's own index.html, got: ${body}`);
  });

  it('links entries under the announced mount prefix', async () => {
    const body = await fetchBody(boundPort(server), '/mounted/app/', { 'x-forwarded-prefix': '/mounted/app' });
    ok(body.includes('href="/mounted/app/video%20%26%20clip.mp4"'), `expected prefixed entry links, got: ${body}`);
  });

  it('keeps serving after a 404 for a missing file', async () => {
    const missing = await fetchStatus(boundPort(server), '/gone.mp4');
    strictEqual(missing, 404);
    const stillUp = await fetchStatus(boundPort(server), '/video%20%26%20clip.mp4');
    strictEqual(stillUp, 200, 'expected the server to keep serving after a 404');
  });
});
