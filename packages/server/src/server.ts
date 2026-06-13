import { stripTypeScriptTypes } from 'node:module';

import { FSWatcher, watch as chokidarWatch } from 'chokidar';
import { randomBytes } from 'crypto';
import { mkdir, readFile, stat, writeFile } from 'fs/promises';
import getPort, { portNumbers } from 'get-port';
import { type OutgoingHttpHeaders, request as httpRequest } from 'http';
import { constants, createSecureServer, type Http2SecureServer, type ServerHttp2Stream } from 'http2';
import { createServer, request as httpsRequest } from 'https';
import { moduleResolve } from 'import-meta-resolve';
import mimeTypes from 'mime-types';
import { connect as netConnect } from 'net';
import { networkInterfaces as getNetworkInterfaces } from 'os';
import { extname, join } from 'path';
import QRCode from 'qrcode';
import { generate as generateSelfSignedCertificate } from 'selfsigned';
import { fileURLToPath, pathToFileURL } from 'url';
import { v5 as uuidv5 } from 'uuid';
import WebSocket, { WebSocketServer } from 'ws';

const HOP_BY_HOP_HEADERS = new Set(['connection', 'upgrade', 'keep-alive', 'transfer-encoding']);
const WS_PROXY_SKIP_HEADERS = new Set(['connection', 'upgrade', 'sec-websocket-key', 'sec-websocket-version', 'host']);
const PACKAGE_EXPORT_CONDITIONS = ['browser', 'import', 'default', 'module', 'require'];
const MODULE_RESOLVE_CONDITIONS = new Set(['module', 'import', 'default']);

const rootDirectory = `${process.cwd()}/`.replaceAll(/\\/g, '/');
const importMetaResolveParent = pathToFileURL(rootDirectory);
const certificatesDirectory = join(import.meta.dirname, '../certificates');

type PackageExportConditions = {
  [condition: string]: PackageExportValue;
};

type PackageExportValue = PackageExportConditions | string | null;

type PackageJson = {
  exports?: PackageExportConditions;
  main?: string;
  type?: string;
};

function resolvePackageExportPath(
  exportValue: PackageExportValue | undefined,
  conditions = PACKAGE_EXPORT_CONDITIONS,
  fallbackToNestedValues = true,
): string | undefined {
  if (typeof exportValue === 'string') return exportValue;
  if (exportValue === null || exportValue === undefined) return undefined;

  for (const condition of conditions) {
    const resolvedPath = resolvePackageExportPath(exportValue[condition], conditions, fallbackToNestedValues);
    if (resolvedPath) return resolvedPath;
  }

  if (!fallbackToNestedValues) return undefined;

  for (const nestedExportValue of Object.values(exportValue)) {
    const resolvedPath = resolvePackageExportPath(nestedExportValue, conditions);
    if (resolvedPath) return resolvedPath;
  }

  return undefined;
}

async function getSourceFilePath(filePath: string): Promise<string | undefined> {
  if (!filePath.includes('/dist/')) return undefined;

  const sourceBaseFilePath = filePath.replace(/\/dist\/(?!.*\/dist\/)/, '/src/');
  const sourceFilePathCandidates = [sourceBaseFilePath];

  if (filePath.endsWith('.js')) {
    sourceFilePathCandidates.unshift(sourceBaseFilePath.replace(/\.js$/, '.ts'));
  }

  for (const sourceFilePathCandidate of sourceFilePathCandidates) {
    const sourceFileMetadata = await stat(sourceFilePathCandidate).catch(() => null);
    if (sourceFileMetadata?.isFile()) {
      return sourceFilePathCandidate;
    }
  }

  return undefined;
}

/**
 * Resolve a bare specifier when its build output is missing on disk.
 *
 * Node resolution (and therefore moduleResolve) throws ERR_MODULE_NOT_FOUND when a package's
 * `main`/`exports` target has not been built yet. The server transpiles `dist/*` from `src/*`
 * on the fly, so the path is valid even though the file is absent. Locate the package through
 * its always-present `package.json` and rebuild the served path without an existence check.
 */
async function resolveUnbuiltSpecifier(specifier: string): Promise<string | undefined> {
  const segments = specifier.split('/');
  const packageName = specifier.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0];
  const subPath = specifier.slice(packageName.length + 1);

  let packageJsonUrl: URL;
  try {
    packageJsonUrl = moduleResolve(`${packageName}/package.json`, importMetaResolveParent, MODULE_RESOLVE_CONDITIONS, true);
  }
  catch {
    return undefined;
  }

  const packageJson = JSON.parse(await readFile(fileURLToPath(packageJsonUrl), 'utf-8')) as PackageJson;
  const rootExport = typeof packageJson.exports === 'string' ? packageJson.exports : packageJson.exports?.['.'];
  const relativePath = subPath
    ? resolvePackageExportPath(packageJson.exports?.[`./${subPath}`]) ?? subPath
    : resolvePackageExportPath(rootExport) ?? packageJson.main ?? 'index.js';

  return new URL(relativePath, packageJsonUrl).href.replace(importMetaResolveParent.href, '/');
}

async function resolveImports(string: string, removeCSSImportAttribute = false): Promise<string> {
  const matches = Array.from(string.matchAll(
    /((?:\bimport\b|\bexport\b)(?:[{\s\w,*$}]*?from)?[\s(]+['"])(.*?)(['"])([\s]+with[\s]+{[\s]+type[\s]*:[\s]+['"](.*?)['"][\s]+})?/g,
  ));

  const promises = [];

  for (const match of matches) {
    promises.push((async () => {
      let importPath = match[2];

      if (!/^[./]/.test(importPath)) {
        try {
          /**
           * Change to import.meta.resolve when we'll be able to choose to resolve only browser code.
           */
          importPath = moduleResolve(importPath, importMetaResolveParent, MODULE_RESOLVE_CONDITIONS, true).href.replace(
            importMetaResolveParent.href,
            '/',
          );
        }
        catch (error) {
          const unbuiltPath = await resolveUnbuiltSpecifier(importPath);
          if (unbuiltPath) {
            importPath = unbuiltPath;
          }
          else {
            console.log(importPath, error);
          }
        }
      }

      // Check if path has no extension and add .js if needed
      if (!/\.[^/]*$/.test(importPath)) {
        try {
          const fullPath = join(rootDirectory, importPath);
          const stats = await stat(fullPath);
          if (!stats.isDirectory()) {
            importPath += '.js';
          }
        }
        catch (error) {
          // If path doesn't exist, assume it's a file and add .js
          importPath += '.js';
        }
      }

      const removeImportAttribute = removeCSSImportAttribute && match[5] === 'css';
      const replacement = match[1] + importPath + match[3] + (match[4] && !removeImportAttribute ? match[4] : '');
      string = string.replace(match[0], replacement);
    })());
  }

  await Promise.all(promises);

  return string;
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
};

function checkBasicAuth(authorizationHeader: string | string[] | undefined, expectedHeader: string): boolean {
  const header = Array.isArray(authorizationHeader) ? authorizationHeader[0] : authorizationHeader;
  return header === expectedHeader;
}

export class Server {
  http2SecureServer: Http2SecureServer;
  ready: Promise<void>;

  #wss?: WebSocketServer;
  #watcher?: FSWatcher;

  constructor(serverOptions: ServerOptions = {}) {
    this.ready = this.#setup(serverOptions);
  }

  async #setup({
    path = '',
    watch = false,
    rootPath = '.',
    resolveModules = false,
    watchIgnore = undefined,
    watchPaths = [],
    verbose = false,
    port = 3000,
    useExternalCertificate = false,
    proxy = {},
    auth,
  }: ServerOptions = {}): Promise<void> {
    const expectedAuthHeader = auth ? `Basic ${Buffer.from(auth).toString('base64')}` : null;

    /**
     * Get port
     */
    const fromPort = port;
    const toPort = port + 100;
    const serverPort = await getPort({ port: portNumbers(fromPort, toPort) });
    const webSocketServerPort = await getPort({ port: portNumbers(fromPort + 10, toPort + 10) });

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
    const addressesString = certificateAddresses.join('_');

    let [cert, key] = await Promise.all([
      readFile(`${certificatesDirectory}/${addressesString}.crt`, { encoding: 'utf-8' }),
      readFile(`${certificatesDirectory}/${addressesString}.key`, { encoding: 'utf-8' }),
    ]).catch(() => [undefined, undefined]);

    if (!key || !cert) {
      console.log('Creating certificate for', certificateAddresses);

      const pems = await generateSelfSignedCertificate([{ name: 'commonName', value: 'localhost' }],
        {
          keySize: 2048,
          algorithm: 'sha256',
          extensions: [
            {
              name: 'subjectAltName',
              altNames: certificateAddresses.map((address) => {
                const isIPAddress = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(address);

                if (isIPAddress) {
                  return ({ type: 7, ip: address });
                }
                else {
                  return ({ type: 2, value: address });
                }
              }),
            },
          ],
        },
      );

      cert = pems.cert;
      key = pems.private;

      await mkdir(`${certificatesDirectory}`, { recursive: true });

      await Promise.all([
        writeFile(`${certificatesDirectory}/${addressesString}.crt`, cert),
        writeFile(`${certificatesDirectory}/${addressesString}.key`, key),
      ]);
    }

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
      const userAgent = headers['user-agent'];
      const fetchDest = headers['sec-fetch-dest'];
      const requestPathString = typeof requestPath === 'string' ? requestPath : requestPath?.[0];

      /**
       * Handle HTTP/2 WebSocket proxy upgrades (RFC 8441)
       */
      if (requestMethod === 'CONNECT' && headers[':protocol'] === 'websocket') {
        for (const { path: proxyPath, url: targetUrl } of proxyEntries) {
          if (!requestPathString?.startsWith(proxyPath)) continue;

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
            let headerString = `GET ${requestPathString} HTTP/1.1\r\n`
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

            if (!stream.headersSent) {
              stream.respond({ ':status': 200 });
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
      if (requestPath === '/.well-known/appspecific/com.chrome.devtools.json') {
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
      for (const [proxyPath, target] of Object.entries(proxy)) {
        if (requestPathString?.startsWith(proxyPath)) {
          const targetUrl = new URL(requestPathString, target);
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

      /**
       * Detect Safari browser to convert CSS imports to JS imports
       */
      const convertCSSImport = userAgent?.includes('Safari') && !userAgent.includes('Chrome');

      try {
        let filePath = `${rootPath}${String(requestPath).split('?')[0]}`;

        /**
         * Synthesize a package.json for subpath exports that don't have a real file on disk.
         * e.g. `node_modules/foo/bar/package.json` → main resolved from foo's `exports['./bar']`.
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
        try {
          if (!/\.[^/]*$/.test(filePath) && !(await stat(filePath))) {
            throw new Error();
          }
        }
        catch (error) {
          filePath = `${rootPath}/`;
        }

        const sourceFilePath = await getSourceFilePath(filePath);

        /**
         * If path is a directory then set index.html file by default
         */
        if (!sourceFilePath && (await stat(filePath))?.isDirectory()) {
          filePath += filePath.endsWith('/') ? 'index.html' : '/index.html';
        }

        const responseHeaders = {
          ':status': constants.HTTP_STATUS_OK,
          'content-type': String(mimeTypes.lookup(filePath)),
          ...(requestRange ? { 'Accept-Ranges': 'bytes' } : {}),
          ...(fetchDest === 'script'
            ? {
                'Cross-Origin-Opener-Policy': 'same-origin',
                'Cross-Origin-Embedder-Policy': 'require-corp',
              }
            : {}),
        };

        const responseFilePath = sourceFilePath ?? filePath;

        this.#watcher?.add(responseFilePath);

        const fileExtension = extname(filePath);

        /**
         * Add socket code on html pages for live reloading
         */
        if (watch && fileExtension === '.html') {
          stream.respond(responseHeaders);
          let fileContent = await readFile(responseFilePath, {
            encoding: 'utf-8',
          });
          if (resolveModules) {
            fileContent = await resolveImports(fileContent, convertCSSImport);
          }
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
          stream.end(fileContent);
        }
        else if (sourceFilePath?.endsWith('.ts')) {
          stream.respond(responseHeaders);
          let fileContent = await readFile(sourceFilePath, {
            encoding: 'utf-8',
          });
          fileContent = stripTypeScriptTypes(fileContent);
          if (resolveModules) {
            fileContent = await resolveImports(fileContent, convertCSSImport);
          }
          stream.end(fileContent);
        }
        else if (resolveModules && (fileExtension === '.js' || fileExtension === '.mjs')) {
          stream.respond(responseHeaders);
          let fileContent = await readFile(responseFilePath, {
            encoding: 'utf-8',
          });
          fileContent = await resolveImports(fileContent, convertCSSImport);
          stream.end(fileContent);
        }
        else if (fileExtension === '.css' && convertCSSImport && fetchDest === 'script') {
          responseHeaders['content-type'] = 'application/javascript';
          stream.respond(responseHeaders);
          let fileContent = await readFile(responseFilePath, {
            encoding: 'utf-8',
          });
          fileContent = `const styles = new CSSStyleSheet();
styles.replaceSync(\`${fileContent.replaceAll(/[`$]/gm, '\\$&')}\`);
export default styles;`;
          stream.end(fileContent);
        }
        else {
          stream.respondWithFile(decodeURIComponent(responseFilePath), responseHeaders);
        }
      }
      catch (error) {
        console.log(error);

        if (stream.closed) return;

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
    // Pre-parse proxy URLs once at startup
    const proxyEntries = Object.entries(proxy).map(([path, target]) => ({
      path,
      url: new URL(target),
    }));

    this.http2SecureServer.on('upgrade', (request, socket, head) => {
      if (expectedAuthHeader && !checkBasicAuth(request.headers['authorization'], expectedAuthHeader)) {
        socket.end('HTTP/1.1 401 Unauthorized\r\nWWW-Authenticate: Basic realm="Dev Server"\r\n\r\n');
        return;
      }

      const requestPath = request.url || '';

      for (const { path: proxyPath, url: targetUrl } of proxyEntries) {
        if (requestPath.startsWith(proxyPath)) {
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
            let headerString = `GET ${requestPath} HTTP/1.1\r\n`;
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
      const url = `https://${address}:${serverPort}/${path}`;
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
