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
  // Module resolution anchors on the process working directory, so the fixture
  // with its own node_modules lives inside it — a tmpdir root would leave bare
  // specifiers unresolvable and the rewrite untestable.
  let fixturePath: string;
  let server: Server;

  before(async () => {
    fixturePath = await mkdtemp('server-test-fixture-');
    await mkdir(join(fixturePath, 'node_modules', 'demo-package'), { recursive: true });
    await writeFile(join(fixturePath, 'node_modules', 'demo-package', 'package.json'), '{"name":"demo-package","main":"index.js"}');
    await writeFile(join(fixturePath, 'node_modules', 'demo-package', 'index.js'), 'export const demo = true;');
    await writeFile(join(fixturePath, 'module.js'), 'import { demo } from \'demo-package\';\nconsole.log(demo);');
    await writeFile(join(fixturePath, 'index.html'), '<html><head><title>test</title></head><body></body></html>');
    server = new Server({ rootPath: fixturePath, watch: true, resolveModules: true, port: 9201 });
    await server.ready;
  });

  after(async () => {
    await server.close();
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
      ok(body.includes('new EventSource("/@livereload")'), `expected the fallback to the configured base for ${JSON.stringify(malformedPrefix)}`);
    }
  });

  it('rewrites module specifiers under the announced prefix without poisoning the unprefixed variant', async () => {
    const unprefixed = await fetchBody(boundPort(server), '/module.js');
    ok(unprefixed.includes(`'/${fixturePath}/node_modules/demo-package/index.js'`), `expected an unprefixed rewritten specifier, got: ${unprefixed}`);
    const prefixed = await fetchBody(boundPort(server), '/mounted/app/module.js', { 'x-forwarded-prefix': '/mounted/app' });
    ok(prefixed.includes(`'/mounted/app/${fixturePath}/node_modules/demo-package/index.js'`), `expected a rewritten specifier under the prefix, got: ${prefixed}`);
    const unprefixedAgain = await fetchBody(boundPort(server), '/module.js');
    strictEqual(unprefixedAgain, unprefixed, 'expected the prefixed variant to be cached separately');
  });
});
