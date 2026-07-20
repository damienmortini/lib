import { ok } from 'node:assert';
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

describe('live-reload client script', () => {
  let rootPath: string;
  let watchingServer: Server;
  let plainServer: Server;

  before(async () => {
    rootPath = await mkdtemp(join(tmpdir(), 'server-test-'));
    await writeFile(join(rootPath, 'index.html'), '<html><head><title>test</title></head><body></body></html>');
    watchingServer = new Server({ rootPath, watch: true, port: 8801 });
    plainServer = new Server({ rootPath, watch: false, port: 8901 });
    await Promise.all([watchingServer.ready, plainServer.ready]);
  });

  after(async () => {
    watchingServer.http2SecureServer.close();
    plainServer.http2SecureServer.close();
    await rm(rootPath, { recursive: true, force: true });
  });

  it('announces changes through a cancelable server:livereload event before reloading', async () => {
    const body = await fetchBody(boundPort(watchingServer), '/index.html');
    ok(body.includes('new EventSource'), 'expected the live-reload client to be injected');
    ok(body.includes('new CustomEvent("server:livereload", { cancelable: true'), 'expected a cancelable server:livereload CustomEvent');
    ok(body.includes('if (window.dispatchEvent(event)) reload()'), 'expected reload to be skipped when the event is prevented');
  });

  it('injects nothing when watch is off', async () => {
    const body = await fetchBody(boundPort(plainServer), '/index.html');
    ok(!body.includes('EventSource'), 'expected no live-reload client without watch');
    ok(!body.includes('server:livereload'), 'expected no livereload event wiring without watch');
  });
});
