import { stripTypeScriptTypes } from 'node:module';

import { FSWatcher, watch as chokidarWatch } from 'chokidar';
import { randomBytes, X509Certificate } from 'crypto';
import { mkdir, readFile, stat, writeFile } from 'fs/promises';
import getPort, { portNumbers } from 'get-port';
import { type OutgoingHttpHeaders, request as httpRequest } from 'http';
import { constants, createSecureServer, type Http2SecureServer, type ServerHttp2Stream } from 'http2';
import { createServer, request as httpsRequest } from 'https';
import mimeTypes from 'mime-types';
import { connect as netConnect, isIP } from 'net';
import { hostname, networkInterfaces as getNetworkInterfaces } from 'os';
import { extname, join, resolve } from 'path';
import QRCode from 'qrcode';
import { generate as generateSelfSignedCertificate } from 'selfsigned';
import { pathToFileURL } from 'url';
import { v5 as uuidv5 } from 'uuid';
import WebSocket, { WebSocketServer } from 'ws';

import {
  buildImportMap,
  getSourceFilePath,
  importMetaResolveParent,
  type PackageJson,
  resolvePackageExportPath,
  resolveSpecifierToServedPath,
  rootDirectory,
  servedPathToSourcePath,
  stripBasePrefix,
  toPosixPath,
} from './module-resolution.ts';

const HOP_BY_HOP_HEADERS = new Set(['connection', 'upgrade', 'keep-alive', 'transfer-encoding']);
const WS_PROXY_SKIP_HEADERS = new Set(['connection', 'upgrade', 'sec-websocket-key', 'sec-websocket-version', 'host']);

const certificatesDirectory = join(import.meta.dirname, '../certificates');

type ProxyConfig = {
  [path: string]: string;
};

type ServerOptions = {
  path?: string;
  watch?: boolean;
  rootPath?: string;
  resolveModules?: boolean;
  watchIgnore?: Array<string | RegExp>;
  watchPaths?: Array<string>;
  verbose?: boolean;
  port?: number;
  useExternalCertificate?: boolean;
  proxy?: ProxyConfig;
  auth?: string;
  /**
   * Mount the server under a URL sub-path (e.g. `damo` → served at `/damo/`).
   * Incoming paths are stripped of the prefix before file lookup and proxy
   * matching, so `proxy` keys must be written WITHOUT the base (use `/api`, not
   * `/damo/api`). Defaults to root.
   */
  base?: string;
};

function checkBasicAuth(authorizationHeader: string | string[] | undefined, expectedHeader: string): boolean {
  const header = Array.isArray(authorizationHeader) ? authorizationHeader[0] : authorizationHeader;
  return header === expectedHeader;
}

async function loadOrCreateCertificate(certificateAddresses: string[]): Promise<{ cert: string; key: string }> {
  const addressesString = certificateAddresses.join('_');

  await mkdir(certificatesDirectory, { recursive: true });

  let [certificateAuthorityCertificate, certificateAuthorityKey] = await Promise.all([
    readFile(`${certificatesDirectory}/certificate-authority.crt`, { encoding: 'utf-8' }),
    readFile(`${certificatesDirectory}/certificate-authority.key`, { encoding: 'utf-8' }),
  ]).catch(() => [undefined, undefined]);

  if (certificateAuthorityCertificate && new Date(new X509Certificate(certificateAuthorityCertificate).validTo) < new Date()) {
    certificateAuthorityCertificate = undefined;
  }

  if (!certificateAuthorityCertificate || !certificateAuthorityKey) {
    console.log('Creating certificate authority');

    const certificateAuthorityExpirationDate = new Date();
    certificateAuthorityExpirationDate.setFullYear(certificateAuthorityExpirationDate.getFullYear() + 10);

    const certificateAuthorityPems = await generateSelfSignedCertificate([{ name: 'commonName', value: `Damo Development CA (${hostname()})` }],
      {
        keySize: 2048,
        algorithm: 'sha256',
        notAfterDate: certificateAuthorityExpirationDate,
        extensions: [
          { name: 'basicConstraints', cA: true, critical: true },
          { name: 'keyUsage', keyCertSign: true, cRLSign: true, critical: true },
        ],
      },
    );

    certificateAuthorityCertificate = certificateAuthorityPems.cert;
    certificateAuthorityKey = certificateAuthorityPems.private;

    await Promise.all([
      writeFile(`${certificatesDirectory}/certificate-authority.crt`, certificateAuthorityCertificate),
      writeFile(`${certificatesDirectory}/certificate-authority.key`, certificateAuthorityKey),
    ]);

    console.log(`Trust ${certificatesDirectory}/certificate-authority.crt on your devices to browse without certificate warnings`);
  }

  let [cert, key] = await Promise.all([
    readFile(`${certificatesDirectory}/${addressesString}.crt`, { encoding: 'utf-8' }),
    readFile(`${certificatesDirectory}/${addressesString}.key`, { encoding: 'utf-8' }),
  ]).catch(() => [undefined, undefined]);

  if (cert) {
    // Cached leaves can predate the certificate authority, chain to a rotated
    // one, or have expired — regenerate instead of resurrecting them.
    const leafCertificate = new X509Certificate(cert);
    const certificateAuthorityPublicKey = new X509Certificate(certificateAuthorityCertificate).publicKey;
    if (!leafCertificate.verify(certificateAuthorityPublicKey) || new Date(leafCertificate.validTo) < new Date()) {
      cert = undefined;
    }
  }

  if (!cert || !key) {
    console.log('Creating certificate for', certificateAddresses);

    const pems = await generateSelfSignedCertificate([{ name: 'commonName', value: 'localhost' }],
      {
        keySize: 2048,
        algorithm: 'sha256',
        ca: { key: certificateAuthorityKey, cert: certificateAuthorityCertificate },
        extensions: [
          { name: 'extKeyUsage', serverAuth: true },
          {
            name: 'subjectAltName',
            altNames: certificateAddresses.map(address => (isIP(address) ? { type: 7, ip: address } : { type: 2, value: address })),
          },
        ],
      },
    );

    // Serve the full chain so clients that trust the certificate authority can verify the leaf.
    cert = `${pems.cert.trimEnd()}\n${certificateAuthorityCertificate}`;
    key = pems.private;

    await Promise.all([
      writeFile(`${certificatesDirectory}/${addressesString}.crt`, cert),
      writeFile(`${certificatesDirectory}/${addressesString}.key`, key),
    ]);
  }

  return { cert, key };
}

export class Server {
  http2SecureServer: Http2SecureServer;
  ready: Promise<void>;

  #wss?: WebSocketServer;
  #watcher?: FSWatcher;
  #watchedPaths = new Set<string>();

  constructor(serverOptions: ServerOptions = {}) {
    this.ready = this.#setup(serverOptions);
  }

  async #setup({
    path = '',
    watch = false,
    rootPath = '.',
    resolveModules = false,
    watchIgnore,
    watchPaths = [],
    verbose = false,
    port = 3000,
    useExternalCertificate = false,
    proxy = {},
    auth,
    base = '',
  }: ServerOptions = {}): Promise<void> {
    // The module-resolution subsystem (import map crawl, /@resolve/) anchors on
    // the process working directory, while file serving anchors on rootPath —
    // with a rootPath elsewhere the server would serve one tree and resolve
    // modules against another.
    if (resolveModules && `${toPosixPath(resolve(rootPath))}/` !== rootDirectory) {
      console.warn(`resolveModules resolves modules from the working directory (${rootDirectory}), not from rootPath "${rootPath}" — run the server from the served root to keep them aligned.`);
    }

    const expectedAuthHeader = auth ? `Basic ${Buffer.from(auth).toString('base64')}` : null;

    // When set, the server is mounted under a sub-path (e.g. `damo`): incoming
    // request paths are stripped of the `/damo` prefix before file lookup, and
    // resolved bare-specifier imports are emitted as `/damo/...` so the browser
    // requests them back under the same prefix instead of the origin root.
    const normalizedBase = base.replace(/^\/+|\/+$/g, '');
    const basePrefix = normalizedBase ? `/${normalizedBase}` : '';
    const servedRoot = normalizedBase ? `/${normalizedBase}/` : '/';

    // Pre-parse proxy URLs once; used by the HTTP proxy and both WebSocket proxy paths.
    const proxyEntries = Object.entries(proxy).map(([proxyPath, target]) => ({
      path: proxyPath,
      url: new URL(target),
    }));

    /**
     * Get port
     */
    const serverPort = await getPort({ port: portNumbers(port, port + 100) });
    const webSocketServerPort = await getPort({ port: portNumbers(port + 10, port + 110) });

    /**
     * Get addresses
     */
    const addresses = ['localhost'];
    const networkInterfaces = getNetworkInterfaces();
    Object.values(networkInterfaces)
      .flatMap(networkInterface => networkInterface ?? [])
      .forEach((networkInterface) => {
        if (networkInterface.family === 'IPv4' && !networkInterface.internal) {
          addresses.push(networkInterface.address);
        }
      });

    /**
     * Create certificate for addresses
     */
    const certificateAddresses = useExternalCertificate ? addresses : ['localhost'];
    const { cert, key } = await loadOrCreateCertificate(certificateAddresses);

    /**
     * Create HTTP2 Server
     */
    this.http2SecureServer = createSecureServer({
      cert,
      key,
      allowHTTP1: true,
      // Allow both HTTP/2 and HTTP/1.1
      ALPNProtocols: ['h2', 'http/1.1'],
      settings: {
        enableConnectProtocol: true,
      },
    });

    this.http2SecureServer.on('error', (error) => {
      console.error(error);
    });

    this.http2SecureServer.on('listening', () => {
      if (watch) {
        /**
         * Create WebSocket server to refresh page on file change
         */
        const webSocketServer = createServer({
          key,
          cert,
        });
        this.#wss = new WebSocketServer({ server: webSocketServer });
        webSocketServer.listen(webSocketServerPort);

        this.#watcher = chokidarWatch(watchPaths, {
          ignored: watchIgnore,
          ignoreInitial: true,
        })
          .on('change', (changedPath) => {
            if (changedPath.endsWith('.css') || changedPath.endsWith('.css.map')) return;
            if (verbose) {
              console.log(`${changedPath} just changed, refresh.`);
            }
            this.refresh();
          });
      }
    });

    this.http2SecureServer.on('stream', async (stream: ServerHttp2Stream, headers) => {
      if (expectedAuthHeader && !checkBasicAuth(headers['authorization'], expectedAuthHeader)) {
        stream.respond({ ':status': 401, 'www-authenticate': 'Basic realm="Dev Server"' });
        stream.end();
        return;
      }

      const requestMethod = headers[constants.HTTP2_HEADER_METHOD] as string;
      const requestAuthority = headers[constants.HTTP2_HEADER_AUTHORITY];
      const requestPath = headers[constants.HTTP2_HEADER_PATH];
      const requestRange = headers[constants.HTTP2_HEADER_RANGE];
      const fetchDest = headers['sec-fetch-dest'];
      const requestPathString = typeof requestPath === 'string' ? requestPath : requestPath?.[0];

      // Strip the mount prefix (e.g. `/damo`) so file serving and proxy matching
      // work off the origin root. `/damo` and `/damo/` both collapse to `/` → the
      // directory index.
      const servedPath = stripBasePrefix(requestPathString ?? '/', basePrefix);

      /**
       * Handle HTTP/2 WebSocket proxy upgrades (RFC 8441)
       */
      if (requestMethod === 'CONNECT' && headers[':protocol'] === 'websocket') {
        for (const { path: proxyPath, url: targetUrl } of proxyEntries) {
          if (!servedPath.startsWith(proxyPath)) continue;

          const targetSocket = netConnect({
            host: targetUrl.hostname,
            port: Number(targetUrl.port) || 80,
            noDelay: true,
          });

          let cleaned = false;
          const cleanup = () => {
            if (cleaned) return;
            cleaned = true;
            targetSocket.destroy();
            stream.destroy();
          };

          targetSocket.on('connect', () => {
            const secWebSocketKey = randomBytes(16).toString('base64');
            let headerString = `GET ${servedPath} HTTP/1.1\r\n`
              + `Host: ${targetUrl.host}\r\n`
              + `Upgrade: websocket\r\n`
              + `Connection: Upgrade\r\n`
              + `Sec-WebSocket-Key: ${secWebSocketKey}\r\n`
              + `Sec-WebSocket-Version: 13\r\n`;
            for (const [key, value] of Object.entries(headers)) {
              if (key[0] === ':' || WS_PROXY_SKIP_HEADERS.has(key)) continue;
              headerString += `${key}: ${Array.isArray(value) ? value.join(', ') : value}\r\n`;
            }
            headerString += '\r\n';
            targetSocket.write(headerString);
          });

          let buffer = Buffer.alloc(0);
          const onTargetData = (chunk: Buffer) => {
            buffer = Buffer.concat([buffer, chunk]);
            const headerEnd = buffer.indexOf('\r\n\r\n');
            if (headerEnd === -1) return;

            const responseString = buffer.slice(0, headerEnd).toString();
            const remainingData = buffer.slice(headerEnd + 4);
            targetSocket.off('data', onTargetData);

            if (!responseString.startsWith('HTTP/1.1 101')) {
              console.error('WebSocket proxy HTTP/1.1 handshake failed:', responseString);
              if (!stream.headersSent) {
                stream.respond({ ':status': 502 });
              }
              stream.end();
              cleanup();
              return;
            }

            // Relay the negotiated extension and subprotocol back to the client.
            // The client's offer (e.g. permessage-deflate) was forwarded to the
            // target, so the target may send compressed frames (RSV1 set); a
            // client that was never told the negotiation succeeded treats those
            // frames as a protocol violation and drops the connection.
            const responseHeaders: Record<string, string | number> = { ':status': 200 };
            for (const line of responseString.split('\r\n').slice(1)) {
              const separatorIndex = line.indexOf(':');
              if (separatorIndex === -1) continue;
              const name = line.slice(0, separatorIndex).trim().toLowerCase();
              if (name !== 'sec-websocket-extensions' && name !== 'sec-websocket-protocol') continue;
              responseHeaders[name] = line.slice(separatorIndex + 1).trim();
            }
            if (!stream.headersSent) {
              stream.respond(responseHeaders);
            }
            if (remainingData.length > 0) stream.write(remainingData);
            targetSocket.pipe(stream);
            stream.pipe(targetSocket);
          };

          targetSocket.on('data', onTargetData);
          targetSocket.on('error', (error) => {
            console.error('WebSocket HTTP/2 proxy target error:', error.message);
            cleanup();
          });
          targetSocket.on('close', cleanup);
          stream.on('error', cleanup);
          stream.on('close', cleanup);
          return;
        }

        stream.respond({ ':status': 404 });
        stream.end();
        return;
      }

      /**
       * Handle Chrome DevTools Automatic Workspace Folders request
       * https://developer.chrome.com/docs/devtools/workspaces/
       */
      if (servedPath === '/.well-known/appspecific/com.chrome.devtools.json') {
        const workspaceConfig = {
          workspace: {
            root: rootDirectory.slice(0, -1),
            uuid: uuidv5(rootDirectory, uuidv5.URL),
          },
        };

        stream.respond({
          ':status': constants.HTTP_STATUS_OK,
          'content-type': 'application/json',
          'cache-control': 'no-cache',
        });
        stream.end(JSON.stringify(workspaceConfig, null, 2));
        return;
      }

      /**
       * Handle proxy requests
       */
      for (const { path: proxyPath, url } of proxyEntries) {
        if (servedPath.startsWith(proxyPath)) {
          const targetUrl = new URL(servedPath, url);
          const isHttps = targetUrl.protocol === 'https:';
          const requester = isHttps ? httpsRequest : httpRequest;

          const proxyRequest = requester({
            hostname: targetUrl.hostname,
            port: Number(targetUrl.port) || (isHttps ? 443 : 80),
            path: targetUrl.pathname + targetUrl.search,
            method: requestMethod,
            headers: {
              ...Object.fromEntries(
                Object.entries(headers).filter(([key]) => key[0] !== ':' && !HOP_BY_HOP_HEADERS.has(key)),
              ),
              'host': targetUrl.host,
              'x-forwarded-proto': (headers[':scheme'] as string) || 'https',
              'x-forwarded-host': (headers[':authority'] as string) || '',
            },
          }, (proxyResponse) => {
            const responseHeaders: OutgoingHttpHeaders = {
              ':status': proxyResponse.statusCode || 502,
            };

            for (const [key, value] of Object.entries(proxyResponse.headers)) {
              if (HOP_BY_HOP_HEADERS.has(key)) continue;
              if (value !== undefined) responseHeaders[key] = value;
            }

            stream.respond(responseHeaders);

            proxyResponse.on('error', (error) => {
              console.error('Proxy response error:', error);
              stream.destroy();
            });

            proxyResponse.pipe(stream);
          });

          proxyRequest.on('error', (error) => {
            console.error('Proxy request error:', error);
            if (!stream.closed && !stream.headersSent) {
              stream.respond({ ':status': constants.HTTP_STATUS_BAD_GATEWAY });
            }
            stream.end();
          });

          stream.on('error', () => {
            proxyRequest.destroy();
          });

          stream.on('close', () => {
            proxyRequest.destroy();
          });

          // Stream request body directly to target (no buffering)
          stream.pipe(proxyRequest);
          return;
        }
      }

      // Only serve files for GET requests
      if (requestMethod !== 'GET') {
        stream.respond({ ':status': constants.HTTP_STATUS_METHOD_NOT_ALLOWED });
        stream.end();
        return;
      }

      try {
        /**
         * Resolve a bare specifier on demand. The import map lists every
         * installed package name; names the page's crawl did not reach point
         * here, so a dynamic import() of a computed name is resolved
         * server-side at import time and answered with a re-export shim
         * pointing at the canonical served module URL.
         */
        const requestFilePath = servedPath.split('?')[0];
        const resolverMatch = requestFilePath.match(/^\/@resolve\/(?<specifier>.+)$/);
        if (resolveModules && resolverMatch) {
          const specifier = decodeURIComponent(resolverMatch.groups!.specifier);
          const refererUrl = URL.parse(String(headers['referer'] ?? ''));
          const parentUrl = refererUrl
            ? pathToFileURL(await servedPathToSourcePath(refererUrl.pathname, servedRoot))
            : importMetaResolveParent;
          const servedModulePath = await resolveSpecifierToServedPath(specifier, parentUrl, servedRoot);
          if (!servedModulePath) {
            stream.respond({ ':status': constants.HTTP_STATUS_NOT_FOUND });
            stream.end();
            return;
          }
          // `export * from` does not forward a default export; add it only
          // when the target module declares one.
          let shim = `export * from '${servedModulePath}';\n`;
          const targetSource = await readFile(await servedPathToSourcePath(servedModulePath, servedRoot), { encoding: 'utf-8' }).catch(() => '');
          if (/\bexport\s+default\b|\bexport\s*\{[^}]*\bdefault\b/.test(targetSource)) {
            shim += `export { default } from '${servedModulePath}';\n`;
          }
          stream.respond({
            ':status': constants.HTTP_STATUS_OK,
            'content-type': 'application/javascript',
            'cache-control': 'no-cache',
          });
          stream.end(shim);
          return;
        }

        let filePath = `${rootPath}${requestFilePath}`;

        /**
         * Synthesize a package.json for subpath exports that don't have a real file on disk.
         * e.g. `node_modules/foo/bar/package.json` → main resolved from foo's `exports['./bar']`.
         * Still required by pages that bypass the import map and resolve manually by
         * fetching `<package>/<subpath>/package.json` and importing its `main` — damo's
         * index.html lazy-loads subpath entries like `@damo/playground-element/demo` this way.
         */
        const virtualPackageJsonMatch = filePath
          .replace(/^\.?\//, '')
          .match(/^node_modules\/(?<packageName>@[^/]+\/[^/]+|[^/]+)\/(?<subPath>.+)\/package\.json$/);
        if (virtualPackageJsonMatch) {
          const { packageName, subPath } = virtualPackageJsonMatch.groups!;
          const physicalStats = await stat(filePath).catch(() => null);
          const physicalExists = physicalStats !== null && !physicalStats.isDirectory();

          if (!physicalExists) {
            try {
              const mainPackageJsonPath = join(rootPath, 'node_modules', packageName, 'package.json');
              const mainPackageJson = JSON.parse(await readFile(mainPackageJsonPath, 'utf-8')) as PackageJson;
              const exportValue = mainPackageJson.exports?.[`./${subPath}`];
              const exportPath = resolvePackageExportPath(exportValue);
              if (exportPath) {
                const depth = subPath.split('/').filter(Boolean).length;
                const resolvePackageJsonPath = (packageJsonPath: string): string => {
                  return '../'.repeat(depth) + packageJsonPath.replace(/^\.\//, '');
                };
                const typesPath = resolvePackageExportPath(exportValue, ['types'], false);
                const packageJson = {
                  main: resolvePackageJsonPath(exportPath),
                  ...(mainPackageJson.type ? { type: mainPackageJson.type } : {}),
                  ...(typesPath ? { types: resolvePackageJsonPath(typesPath) } : {}),
                };
                stream.respond({
                  ':status': constants.HTTP_STATUS_OK,
                  'content-type': 'application/json',
                });
                stream.end(JSON.stringify(packageJson, null, 2));
                return;
              }
            }
            catch (error) {
              console.log(`Virtual package.json resolution failed for ${filePath}:`, error);
            }
          }
        }

        /**
         * Rewrite to root if url isn't a file and doesn't exist
         */
        if (!/\.[^/]*$/.test(filePath) && !(await stat(filePath).catch(() => null))) {
          filePath = `${rootPath}/`;
        }

        const sourceFilePath = await getSourceFilePath(filePath);

        /**
         * If path is a directory then set index.html file by default
         */
        if (!sourceFilePath && (await stat(filePath)).isDirectory()) {
          filePath += filePath.endsWith('/') ? 'index.html' : '/index.html';
        }

        const responseHeaders = {
          ':status': constants.HTTP_STATUS_OK,
          'content-type': String(mimeTypes.lookup(filePath)),
          // Transpiled TypeScript and rewritten modules are generated from source on
          // every request, so the browser must revalidate rather than reuse a cached
          // copy — otherwise an edited source file is shadowed by a stale module.
          'cache-control': 'no-cache',
          ...(requestRange ? { 'Accept-Ranges': 'bytes' } : {}),
          ...(fetchDest === 'script'
            ? {
                'Cross-Origin-Opener-Policy': 'same-origin',
                'Cross-Origin-Embedder-Policy': 'require-corp',
              }
            : {}),
        };

        const responseFilePath = sourceFilePath ?? filePath;

        // chokidar's add() re-stats the path and rebuilds its ignore matcher
        // even when the path is already watched, so gate repeat requests.
        if (this.#watcher && !this.#watchedPaths.has(responseFilePath)) {
          this.#watchedPaths.add(responseFilePath);
          this.#watcher.add(responseFilePath);
        }

        const fileExtension = extname(filePath);

        /**
         * HTML pages get the generated import map (resolveModules) and the
         * live-reload socket (watch) — two independent transforms.
         */
        if ((watch || resolveModules) && fileExtension === '.html') {
          let fileContent = await readFile(responseFilePath, {
            encoding: 'utf-8',
          });
          stream.respond(responseHeaders);
          if (resolveModules) {
            const pageServedPath = `${servedRoot.slice(0, -1)}${filePath.slice(rootPath.length)}`;
            const importMap = await buildImportMap(fileContent, pageServedPath, servedRoot);
            if (Object.keys(importMap.imports).length) {
              const importMapScript = `<script type="importmap">${JSON.stringify(importMap)}</script>`;
              // The map must precede every module script; fall back to
              // prepending when the page has no <head>.
              fileContent = /<head[^>]*>/.test(fileContent)
                ? fileContent.replace(/<head[^>]*>/, headTag => `${headTag}\n${importMapScript}`)
                : `${importMapScript}\n${fileContent}`;
            }
          }
          if (watch) {
            fileContent = fileContent.replace(
              '</head>',
              `<script>
const socket = new WebSocket("wss://${String(requestAuthority).split(':')[0]}:${webSocketServerPort}");
let forceReload = false;
window.navigation?.addEventListener('navigate', (event) => {
  if(forceReload) event.stopImmediatePropagation();
});
socket.addEventListener("message", function (event) {
  forceReload = true;
  window.location.reload();
});
</script>
</head>`,
            );
          }
          stream.end(fileContent);
        }
        else if (sourceFilePath?.endsWith('.ts')) {
          stream.respond(responseHeaders);
          const fileContent = await readFile(sourceFilePath, {
            encoding: 'utf-8',
          });
          stream.end(stripTypeScriptTypes(fileContent));
        }
        else {
          stream.respondWithFile(decodeURIComponent(responseFilePath), responseHeaders);
        }
      }
      catch (error) {
        console.log(error);

        if (stream.closed) return;

        // Headers already sent: responding again throws synchronously and
        // brings the whole server down, so terminate the stream instead.
        if (stream.headersSent) {
          stream.end();
          return;
        }

        if (error.code === 'ENOENT') {
          stream.respond({ ':status': constants.HTTP_STATUS_NOT_FOUND });
        }
        else {
          stream.respond({
            ':status': constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
          });
        }
        stream.end();
      }

      stream.on('error', (error) => {
        console.log(error);
      });
    });

    /**
     * Handle WebSocket proxy upgrades
     */
    this.http2SecureServer.on('upgrade', (request, socket, head) => {
      if (expectedAuthHeader && !checkBasicAuth(request.headers['authorization'], expectedAuthHeader)) {
        socket.end('HTTP/1.1 401 Unauthorized\r\nWWW-Authenticate: Basic realm="Dev Server"\r\n\r\n');
        return;
      }

      const requestPath = request.url || '';
      // Strip the mount prefix (mirrors the stream handler) so proxy rules match
      // and the upstream target receives the un-prefixed path under a base.
      const strippedPath = stripBasePrefix(requestPath, basePrefix);

      for (const { path: proxyPath, url: targetUrl } of proxyEntries) {
        if (strippedPath.startsWith(proxyPath)) {
          // Disable Nagle's algorithm on client socket for lower latency
          socket.setNoDelay(true);

          const targetSocket = netConnect({
            host: targetUrl.hostname,
            port: Number(targetUrl.port) || 80,
            noDelay: true,
          });

          let cleaned = false;
          const cleanup = () => {
            if (cleaned) return;
            cleaned = true;
            targetSocket.destroy();
            socket.destroy();
          };

          targetSocket.on('connect', () => {
            // Forward the original upgrade request with all headers to target
            let headerString = `GET ${strippedPath} HTTP/1.1\r\n`;
            for (const [key, value] of Object.entries(request.headers)) {
              if (key === 'host') {
                headerString += `Host: ${targetUrl.host}\r\n`;
              }
              else if (value !== undefined) {
                headerString += `${key}: ${Array.isArray(value) ? value.join(', ') : value}\r\n`;
              }
            }
            headerString += '\r\n';

            targetSocket.write(headerString);

            if (head.length > 0) {
              targetSocket.write(head);
            }

            // Pipe bidirectionally
            targetSocket.pipe(socket);
            socket.pipe(targetSocket);
          });

          targetSocket.on('error', (error) => {
            console.error('WebSocket proxy target error:', error.message);
            cleanup();
          });
          targetSocket.on('close', cleanup);
          socket.on('error', cleanup);
          socket.on('close', cleanup);

          return;
        }
      }

      // No proxy match - reject the upgrade request
      socket.end('HTTP/1.1 404 Not Found\r\n\r\n');
    });

    this.http2SecureServer.listen(serverPort);

    for (const [index, address] of addresses.entries()) {
      const url = `https://${address}:${serverPort}${basePrefix}/${path}`;
      console.log(url);
      if (index !== 0) {
        console.log(await QRCode.toString(url, { type: 'terminal', small: true }));
      }
    }
  }

  refresh(): void {
    if (!this.#wss) return;
    for (const client of this.#wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send('refresh');
      }
    }
  }
}
