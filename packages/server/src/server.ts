import { stripTypeScriptTypes } from 'node:module';

import { FSWatcher, watch as chokidarWatch } from 'chokidar';
import { createHash, randomBytes, X509Certificate } from 'crypto';
import { mkdir, readFile, stat, writeFile } from 'fs/promises';
import getPort, { portNumbers } from 'get-port';
import { type OutgoingHttpHeaders, request as httpRequest } from 'http';
import { constants, createSecureServer, type Http2SecureServer, type IncomingHttpHeaders, type ServerHttp2Stream } from 'http2';
import { request as httpsRequest } from 'https';
import mimeTypes from 'mime-types';
import { connect as netConnect, isIP } from 'net';
import { hostname, networkInterfaces as getNetworkInterfaces } from 'os';
import { extname, join, resolve } from 'path';
import QRCode from 'qrcode';
import { generate as generateSelfSignedCertificate } from 'selfsigned';
import { pathToFileURL } from 'url';
import { v5 as uuidv5 } from 'uuid';
import { gzipSync } from 'zlib';

import {
  buildImportMap,
  getSourceFilePath,
  type ImportMap,
  importMetaResolveParent,
  type PackageJson,
  resolvePackageExportPath,
  resolveSpecifierToServedPath,
  rewriteModuleSpecifiers,
  rootDirectory,
  servedPathToSourcePath,
  stripBasePrefix,
  toPosixPath,
} from './module-resolution.ts';

const HOP_BY_HOP_HEADERS = new Set(['connection', 'upgrade', 'keep-alive', 'transfer-encoding']);
const WS_PROXY_SKIP_HEADERS = new Set(['connection', 'upgrade', 'sec-websocket-key', 'sec-websocket-version', 'host']);
// Path (under the mount prefix) the injected client opens for live reload.
const LIVE_RELOAD_PATH = '/@livereload';

const certificatesDirectory = join(import.meta.dirname, '../certificates');

// ── Response caching / compression ──────────────────────────────────────────
// Every response keeps `cache-control: no-cache` (the browser must revalidate,
// so an edited source is never shadowed), but carries an ETag validator so that
// revalidation can answer 304 Not Modified instead of resending the full body,
// and bodies are gzip-compressed for clients that accept it.

// Bodies below this size gain nothing from compression (the frame overhead
// outweighs the saving).
const GZIP_MIN_BYTES = 1024;
// Static files served whole (not transpiled/rewritten) are only read into
// memory for compression up to this size; larger ones stream uncompressed.
const MAX_COMPRESSED_FILE_BYTES = 8 * 1024 * 1024;
// Text-like static payloads worth compressing; binary media (images, video,
// woff2) is already compressed and is left alone.
const COMPRESSIBLE_EXTENSIONS = new Set([
  '.js', '.mjs', '.cjs', '.ts', '.css', '.html', '.htm', '.json', '.svg',
  '.map', '.txt', '.md', '.xml', '.webmanifest', '.wasm',
]);
// Generated responses (transpiled TypeScript, rewritten modules, compressed
// statics) cached by source path, invalidated by mtime+size; bounded so a big
// tree can't grow the cache without limit (insertion order doubles as LRU).
const RESPONSE_CACHE_MAX_ENTRIES = 500;

type ResponseEntity = {
  body: string | Buffer;
  etag: string;
  gzip?: Buffer;
};

type CachedResponse = ResponseEntity & {
  mtimeMs: number;
  size: number;
};

function contentEtag(body: string | Buffer): string {
  return `"${createHash('sha1').update(body).digest('base64url')}"`;
}

function acceptsGzip(requestHeaders: IncomingHttpHeaders): boolean {
  return String(requestHeaders['accept-encoding'] ?? '').includes('gzip');
}

function respondNotModified(stream: ServerHttp2Stream, etag: string): void {
  stream.respond({ ':status': constants.HTTP_STATUS_NOT_MODIFIED, 'etag': etag, 'cache-control': 'no-cache' });
  stream.end();
}

// Answer 304 when the client already holds this exact entity, otherwise send
// the body — gzipped (compressed once, memoized on the entity) when accepted.
function sendCachedBody(
  stream: ServerHttp2Stream,
  requestHeaders: IncomingHttpHeaders,
  responseHeaders: OutgoingHttpHeaders,
  entity: ResponseEntity,
): void {
  if (requestHeaders['if-none-match'] === entity.etag) {
    respondNotModified(stream, entity.etag);
    return;
  }
  const headersWithValidator: OutgoingHttpHeaders = { ...responseHeaders, 'etag': entity.etag, 'vary': 'accept-encoding' };
  const bodyLength = typeof entity.body === 'string' ? Buffer.byteLength(entity.body) : entity.body.length;
  if (bodyLength >= GZIP_MIN_BYTES && acceptsGzip(requestHeaders)) {
    entity.gzip ??= gzipSync(entity.body);
    stream.respond({ ...headersWithValidator, 'content-encoding': 'gzip' });
    stream.end(entity.gzip);
    return;
  }
  stream.respond(headersWithValidator);
  stream.end(entity.body);
}

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

  #liveReloadStreams = new Set<ServerHttp2Stream>();
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

    // Generated responses memoized by source path, invalidated by mtime+size —
    // so a request for an unchanged file skips the read/transpile/rewrite work.
    // Known limit: a rewritten module's specifier targets also depend on the
    // node_modules layout, which mtime of the source does not track; after an
    // install that changes resolution without touching sources, a server
    // restart (or touching the file) refreshes the entry.
    const responseCache = new Map<string, CachedResponse>();

    // Return the cached entry for an unchanged file, or produce, cache and
    // return a fresh one. Re-insertion keeps insertion order tracking recency,
    // so the eviction drops the least recently used entry.
    async function cachedResponse(
      cacheKey: string,
      fileStats: { mtimeMs: number; size: number },
      produceBody: () => Promise<string | Buffer>,
      etag?: string,
    ): Promise<CachedResponse> {
      let entry = responseCache.get(cacheKey);
      if (!entry || entry.mtimeMs !== fileStats.mtimeMs || entry.size !== fileStats.size) {
        const body = await produceBody();
        entry = { mtimeMs: fileStats.mtimeMs, size: fileStats.size, body, etag: etag ?? contentEtag(body) };
      }
      responseCache.delete(cacheKey);
      responseCache.set(cacheKey, entry);
      if (responseCache.size > RESPONSE_CACHE_MAX_ENTRIES) {
        responseCache.delete(responseCache.keys().next().value!);
      }
      return entry;
    }

    // Import maps memoized per page. A map is only rebuilt when one of the
    // files that shaped it (crawled module sources, the page itself, the
    // enumerated node_modules directories) changes on disk — stat'ing those is
    // orders of magnitude cheaper than re-crawling the module graph.
    const importMapCache = new Map<string, { importMap: ImportMap; dependencyVersions: Map<string, number> }>();

    async function fileVersion(dependencyPath: string): Promise<number> {
      const stats = await stat(dependencyPath).catch(() => null);
      return stats ? stats.mtimeMs : -1;
    }

    async function getImportMap(htmlContent: string, pageServedPath: string, pageFilePath: string): Promise<ImportMap> {
      const cached = importMapCache.get(pageServedPath);
      if (cached) {
        const versionChecks = await Promise.all(
          [...cached.dependencyVersions].map(async ([dependencyPath, version]) => await fileVersion(dependencyPath) === version),
        );
        if (versionChecks.every(Boolean)) return cached.importMap;
      }
      const { importMap, dependencyPaths } = await buildImportMap(htmlContent, pageServedPath, servedRoot);
      // The page file itself is always a dependency: editing its module scripts
      // must invalidate the map even when no crawled module changed.
      const dependencyVersions = new Map(await Promise.all(
        [...new Set([pageFilePath, ...dependencyPaths])].map(async (dependencyPath): Promise<[string, number]> =>
          [dependencyPath, await fileVersion(dependencyPath)]),
      ));
      importMapCache.set(pageServedPath, { importMap, dependencyVersions });
      return importMap;
    }

    /**
     * Get port
     */
    const serverPort = await getPort({ port: portNumbers(port, port + 100) });

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
        this.#watcher = chokidarWatch(watchPaths, {
          ignored: watchIgnore,
          ignoreInitial: true,
          // Poll by path rather than inode: editors save atomically (write temp +
          // rename), which swaps the inode and makes an inotify watch on the old
          // one go stale. Polling also sidesteps unreliable inotify on mounted
          // volumes. The cost is periodic stats of the handful of served files.
          usePolling: true,
          interval: 200,
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
      const requestMethod = headers[constants.HTTP2_HEADER_METHOD] as string;
      const requestPath = headers[constants.HTTP2_HEADER_PATH];
      const requestRange = headers[constants.HTTP2_HEADER_RANGE];
      const fetchDest = headers['sec-fetch-dest'];
      const requestPathString = typeof requestPath === 'string' ? requestPath : requestPath?.[0];

      // Strip the mount prefix (e.g. `/damo`) so file serving and proxy matching
      // work off the origin root. `/damo` and `/damo/` both collapse to `/` → the
      // directory index.
      const servedPath = stripBasePrefix(requestPathString ?? '/', basePrefix);

      if (expectedAuthHeader && !checkBasicAuth(headers['authorization'], expectedAuthHeader)) {
        stream.respond({ ':status': 401, 'www-authenticate': 'Basic realm="Dev Server"' });
        stream.end();
        return;
      }

      // Live-reload event stream (Server-Sent Events): a plain HTTP response on
      // the page's own origin, so it rides the same connection with no WebSocket
      // machinery, and EventSource reconnects on its own after a server restart.
      if (watch && servedPath === LIVE_RELOAD_PATH) {
        stream.respond({
          ':status': constants.HTTP_STATUS_OK,
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache',
        });
        // EventSource waits a few seconds before reconnecting by default; match
        // the snappier 1s cadence the previous WebSocket client used.
        stream.write('retry: 1000\n\n');
        if (verbose) console.log('live-reload client connected');
        this.#liveReloadStreams.add(stream);
        const removeStream = (): void => {
          this.#liveReloadStreams.delete(stream);
        };
        stream.on('close', removeStream);
        stream.on('error', removeStream);
        return;
      }

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
          if (resolveModules) {
            const pageServedPath = `${servedRoot.slice(0, -1)}${filePath.slice(rootPath.length)}`;
            const importMap = await getImportMap(fileContent, pageServedPath, responseFilePath);
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
(function () {
  let forceReload = false;
  let hadConnection = false;
  window.navigation?.addEventListener('navigate', (event) => {
    if (forceReload) event.stopImmediatePropagation();
  });
  function reload() {
    forceReload = true;
    location.reload();
  }
  // Cancelable so a page can take over the reload (event.preventDefault()) and
  // handle the update itself — e.g. surface a manual refresh control instead.
  function announce(reason) {
    const event = new CustomEvent("server:livereload", { cancelable: true, detail: { reason } });
    if (window.dispatchEvent(event)) reload();
  }
  const eventSource = new EventSource("${basePrefix}${LIVE_RELOAD_PATH}");
  eventSource.addEventListener("message", () => announce("change"));
  // EventSource reconnects on its own; a reconnect after the server (or
  // connection) dropped means we may have missed changes — reload.
  eventSource.addEventListener("open", function () {
    if (hadConnection) announce("reconnect");
    hadConnection = true;
  });
})();
</script>
</head>`,
            );
          }
          // The transformed page is small and cheap to assemble (the import map
          // is cached above), so it is hashed per request rather than memoized.
          sendCachedBody(stream, headers, responseHeaders, { body: fileContent, etag: contentEtag(fileContent) });
        }
        else if (sourceFilePath?.endsWith('.ts')) {
          const entry = await cachedResponse(sourceFilePath, await stat(sourceFilePath), async () => {
            const fileContent = await readFile(sourceFilePath, {
              encoding: 'utf-8',
            });
            const javaScript = stripTypeScriptTypes(fileContent);
            // Rewrite bare imports to resolved URLs so module workers, which never
            // receive the page's import map, can still resolve their dependencies.
            return resolveModules ? await rewriteModuleSpecifiers(javaScript, sourceFilePath, servedRoot) : javaScript;
          });
          sendCachedBody(stream, headers, responseHeaders, entry);
        }
        // Plain JS modules (no TypeScript source) carry the same bare imports a
        // worker cannot resolve via the import map; rewrite them the same way.
        // Range requests fall through to respondWithFile — rewriting a partial
        // body would corrupt it, and module scripts are never range-requested.
        else if (resolveModules && !requestRange && (fileExtension === '.js' || fileExtension === '.mjs')) {
          const modulePath = decodeURIComponent(responseFilePath);
          const entry = await cachedResponse(modulePath, await stat(modulePath), async () => {
            const fileContent = await readFile(modulePath, { encoding: 'utf-8' });
            return rewriteModuleSpecifiers(fileContent, modulePath, servedRoot);
          });
          sendCachedBody(stream, headers, responseHeaders, entry);
        }
        else {
          const staticFilePath = decodeURIComponent(responseFilePath);
          const fileStats = await stat(staticFilePath);
          // Static bodies come straight off disk, so mtime+size is a sufficient
          // validator — no need to hash the content.
          const etag = `"${fileStats.mtimeMs}-${fileStats.size}"`;
          if (headers['if-none-match'] === etag) {
            respondNotModified(stream, etag);
          }
          else if (
            !requestRange
            && fileStats.size <= MAX_COMPRESSED_FILE_BYTES
            && COMPRESSIBLE_EXTENSIONS.has(fileExtension)
            && acceptsGzip(headers)
          ) {
            const entry = await cachedResponse(staticFilePath, fileStats, () => readFile(staticFilePath), etag);
            sendCachedBody(stream, headers, responseHeaders, entry);
          }
          else {
            stream.respondWithFile(staticFilePath, { ...responseHeaders, etag });
          }
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
      const requestPath = request.url || '';
      // Strip the mount prefix (mirrors the stream handler) so proxy rules match
      // and the upstream target receives the un-prefixed path under a base.
      const strippedPath = stripBasePrefix(requestPath, basePrefix);

      if (expectedAuthHeader && !checkBasicAuth(request.headers['authorization'], expectedAuthHeader)) {
        socket.end('HTTP/1.1 401 Unauthorized\r\nWWW-Authenticate: Basic realm="Dev Server"\r\n\r\n');
        return;
      }

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
    for (const stream of this.#liveReloadStreams) {
      if (!stream.destroyed) {
        stream.write('data: refresh\n\n');
      }
    }
  }
}
