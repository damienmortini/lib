import { ok, strictEqual } from 'node:assert';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { connect } from 'node:http2';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';

import { Server } from './server.ts';

async function fetchBody(port: number, path: string): Promise<string> {
  const session = connect(`https://localhost:${port}`, { rejectUnauthorized: false });
  try {
    return await new Promise<string>((resolvePromise, rejectPromise) => {
      session.on('error', rejectPromise);
      const stream = session.request({ ':path': path });
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
    watchingServer.http2SecureServer.close();
    plainServer.http2SecureServer.close();
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

  it('announces a reconnect, but not the first connection', () => {
    const client = runInjectedClient(watchingPage);
    const reasons: unknown[] = [];
    client.window.addEventListener('server:livereload', (event) => {
      event.preventDefault();
      reasons.push((event as CustomEvent).detail.reason);
    });
    client.eventSource.dispatchEvent(new Event('open'));
    strictEqual(reasons.length, 0, 'the first open is not a reconnect');
    client.eventSource.dispatchEvent(new Event('open'));
    strictEqual(reasons[0], 'reconnect');
    strictEqual(client.reloadCount(), 0);
  });

  it('injects nothing when watch is off', async () => {
    const body = await fetchBody(boundPort(plainServer), '/index.html');
    ok(!body.includes('EventSource'), 'expected no live-reload client without watch');
    ok(!body.includes('server:livereload'), 'expected no livereload event wiring without watch');
  });
});
