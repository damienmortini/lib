import { stripTypeScriptTypes } from 'node:module';

import { FSWatcher, watch as chokidarWatch } from 'chokidar';
import { randomBytes, X509Certificate } from 'crypto';
import { mkdir, readdir, readFile, readlink, stat, writeFile } from 'fs/promises';
import getPort, { portNumbers } from 'get-port';
import { type OutgoingHttpHeaders, request as httpRequest } from 'http';
import { constants, createSecureServer, type Http2SecureServer, type ServerHttp2Stream } from 'http2';
import { createServer, request as httpsRequest } from 'https';
import { moduleResolve } from 'import-meta-resolve';
import mimeTypes from 'mime-types';
import { connect as netConnect, isIP } from 'net';
import { hostname, networkInterfaces as getNetworkInterfaces } from 'os';
import { dirname, extname, join, resolve } from 'path';
import QRCode from 'qrcode';
import { generate as generateSelfSignedCertificate } from 'selfsigned';
import { fileURLToPath, pathToFileURL } from 'url';
import { v5 as uuidv5 } from 'uuid';
import WebSocket, { WebSocketServer } from 'ws';

const HOP_BY_HOP_HEADERS = new Set(['connection', 'upgrade', 'keep-alive', 'transfer-encoding']);
const WS_PROXY_SKIP_HEADERS = new Set(['connection', 'upgrade', 'sec-websocket-key', 'sec-websocket-version', 'host']);
const PACKAGE_EXPORT_CONDITIONS = ['browser', 'import', 'default', 'module', 'require'];
const MODULE_RESOLVE_CONDITIONS = new Set(['module', 'import', 'default']);

function toPosixPath(path: string): string {
  return path.replaceAll(/\\/g, '/');
}

const rootDirectory = toPosixPath(`${process.cwd()}/`);
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
 * Collapse a resolved module URL onto one canonical served URL.
 *
 * Browsers deduplicate ES modules by URL, so the same package reached through
 * different node_modules symlinks (pnpm links dependencies per consuming
 * package) would evaluate once per URL, and side effects like
 * customElements.define() would throw on the second evaluation. Resolve
 * symlinks component by component, like Node's --preserve-symlinks traversal,
 * keeping a link as-is when its target leaves the served root (e.g. a
 * submodule symlink to a sibling checkout) — a plain realpath would escape
 * the root there.
 */
async function canonicalizeModuleUrl(moduleUrl: URL): Promise<URL> {
  if (!moduleUrl.href.startsWith(importMetaResolveParent.href)) return moduleUrl;

  const modulePath = toPosixPath(fileURLToPath(moduleUrl));
  let currentPath = rootDirectory.slice(0, -1);
  for (const pathComponent of modulePath.slice(rootDirectory.length).split('/')) {
    let candidatePath = `${currentPath}/${pathComponent}`;
    for (let symlinkHopCount = 0; symlinkHopCount < 10; symlinkHopCount++) {
      const symlinkTarget = await readlink(candidatePath).catch(() => null);
      if (symlinkTarget === null) break;
      const resolvedTargetPath = toPosixPath(resolve(dirname(candidatePath), symlinkTarget));
      if (!`${resolvedTargetPath}/`.startsWith(rootDirectory)) break;
      candidatePath = resolvedTargetPath;
    }
    currentPath = candidatePath;
  }
  return pathToFileURL(currentPath);
}

/**
 * Resolve a bare specifier when its build output is missing on disk.
 *
 * Node resolution (and therefore moduleResolve) throws ERR_MODULE_NOT_FOUND when a package's
 * `main`/`exports` target has not been built yet. The server transpiles `dist/*` from `src/*`
 * on the fly, so the path is valid even though the file is absent. Locate the package through
 * its always-present `package.json` and rebuild the module URL without an existence check.
 * The `package.json` lookup walks the `node_modules` chain directly (like Node's package
 * lookup) because resolving `<package>/package.json` through moduleResolve throws
 * ERR_PACKAGE_PATH_NOT_EXPORTED for packages whose `exports` map does not expose it.
 */
async function resolveUnbuiltSpecifier(specifier: string, parentUrl: URL): Promise<URL | undefined> {
  const segments = specifier.split('/');
  const packageName = specifier.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0];
  const subPath = specifier.slice(packageName.length + 1);

  let packageJsonUrl: URL;
  let directoryUrl = new URL('.', parentUrl);
  while (true) {
    const candidateUrl = new URL(`node_modules/${packageName}/package.json`, directoryUrl);
    const candidateStats = await stat(fileURLToPath(candidateUrl)).catch(() => null);
    if (candidateStats?.isFile()) {
      packageJsonUrl = candidateUrl;
      break;
    }
    const parentDirectoryUrl = new URL('..', directoryUrl);
    if (parentDirectoryUrl.href === directoryUrl.href) return undefined;
    directoryUrl = parentDirectoryUrl;
  }

  const packageJson = JSON.parse(await readFile(fileURLToPath(packageJsonUrl), 'utf-8')) as PackageJson;
  const rootExport = typeof packageJson.exports === 'string' ? packageJson.exports : packageJson.exports?.['.'];
  const relativePath = subPath
    ? resolvePackageExportPath(packageJson.exports?.[`./${subPath}`]) ?? subPath
    : resolvePackageExportPath(rootExport) ?? packageJson.main ?? 'index.js';

  return new URL(relativePath, packageJsonUrl);
}

type ImportMap = {
  imports: { [specifier: string]: string };
  scopes?: { [scopePrefix: string]: { [specifier: string]: string } };
};

const IMPORT_STATEMENT_REGEX = /(?:\bimport\b|\bexport\b)(?:[{\s\w,*$}]*?from)?[\s(]+['"](.*?)['"]/g;
const MODULE_SCRIPT_REGEX = /(<script\b[^>]*\btype\s*=\s*["']module["'][^>]*>)([\s\S]*?)<\/script>/gi;
const CRAWLABLE_EXTENSIONS = new Set(['.js', '.mjs', '.ts']);

// Dummy origin for resolving relative specifiers against served paths.
const SERVED_PATH_BASE = 'http://internal';

// Map a browser-visible path to the file that would be served for it (a
// `dist/*` request is answered from `src/*` when that source exists).
async function servedPathToSourcePath(servedPath: string, servedRoot: string): Promise<string> {
  const diskPath = join(rootDirectory, stripBasePrefix(servedPath, servedRoot.slice(0, -1)));
  return await getSourceFilePath(diskPath) ?? diskPath;
}

// Resolve a bare specifier from a parent module to its canonical served path,
// or undefined when it cannot be resolved. The optional memo collapses repeat
// canonicalizations of the same resolved URL within one request.
async function resolveSpecifierToServedPath(
  specifier: string,
  parentUrl: URL,
  servedRoot: string,
  canonicalServedPaths?: Map<string, Promise<string>>,
): Promise<string | undefined> {
  let moduleUrl: URL | undefined;
  try {
    moduleUrl = moduleResolve(specifier, parentUrl, MODULE_RESOLVE_CONDITIONS, true);
  }
  catch {
    moduleUrl = await resolveUnbuiltSpecifier(specifier, parentUrl);
  }
  if (!moduleUrl) return undefined;

  let servedPathPromise = canonicalServedPaths?.get(moduleUrl.href);
  if (!servedPathPromise) {
    // Arrow replacer so `$`-sequences in servedRoot are treated literally, not
    // as String.replace special patterns ($&, $', …).
    servedPathPromise = canonicalizeModuleUrl(moduleUrl)
      .then(canonicalUrl => canonicalUrl.href.replace(importMetaResolveParent.href, () => servedRoot));
    canonicalServedPaths?.set(moduleUrl.href, servedPathPromise);
  }
  return servedPathPromise;
}

/**
 * Build an import map for an HTML page by crawling its module graph.
 *
 * The browser resolves bare specifiers itself through the injected map, so
 * served module bodies are never rewritten. Each module's bare imports are
 * resolved from that module's own location like Node does — pnpm does not
 * hoist transitive dependencies of linked packages into the served root's
 * node_modules — and canonicalized so every package maps to exactly one URL
 * (browsers deduplicate modules by URL). If the same specifier resolves to a
 * different target from some importer, that resolution is scoped to the
 * importer's directory.
 */
async function buildImportMap(htmlContent: string, pageServedPath: string, servedRoot: string): Promise<ImportMap> {
  const importMap: ImportMap = { imports: {} };
  const scopes: { [scopePrefix: string]: { [specifier: string]: string } } = {};
  const visitedModulePaths = new Set<string>();
  const visitedSourceDirectories = new Set<string>();
  // Many modules import the same package; canonicalize each resolved URL once.
  const canonicalServedPaths = new Map<string, Promise<string>>();
  // Crawl tasks run concurrently and append newly discovered modules as the
  // graph unfolds; the drain loop below picks the additions up, so total crawl
  // time tracks the longest import chain rather than the module count.
  const crawlTasks: Promise<void>[] = [];

  function enqueue(servedModulePath: string): void {
    if (!CRAWLABLE_EXTENSIONS.has(extname(servedModulePath))) return;
    if (visitedModulePaths.has(servedModulePath)) return;
    visitedModulePaths.add(servedModulePath);
    crawlTasks.push(crawlModule(servedModulePath));
  }

  async function crawlModule(servedModulePath: string): Promise<void> {
    const sourceFilePath = await servedPathToSourcePath(servedModulePath, servedRoot);
    visitedSourceDirectories.add(toPosixPath(dirname(sourceFilePath)));
    const content = await readFile(sourceFilePath, { encoding: 'utf-8' }).catch(() => null);
    if (content === null) return;
    await collectImports(content, sourceFilePath, servedModulePath);
  }

  async function collectImports(content: string, importerSourceFilePath: string, importerServedPath: string): Promise<void> {
    const importerBaseUrl = new URL(importerServedPath, SERVED_PATH_BASE);
    const parentUrl = pathToFileURL(importerSourceFilePath);
    await Promise.all(Array.from(content.matchAll(IMPORT_STATEMENT_REGEX), async (match) => {
      const specifier = match[1];
      // Skip full URLs (node:, data:, https:, …) — nothing to map or crawl.
      if (/^[a-z][a-z0-9+.-]*:/i.test(specifier)) return;
      if (/^[./]/.test(specifier)) {
        enqueue(new URL(specifier, importerBaseUrl).pathname);
        return;
      }
      const servedModulePath = await resolveSpecifierToServedPath(specifier, parentUrl, servedRoot, canonicalServedPaths);
      // Leave an unresolvable specifier out of the map so the browser error
      // names the real specifier.
      if (!servedModulePath) {
        console.log(`Unresolvable specifier "${specifier}" imported from ${importerServedPath}`);
        return;
      }
      const mappedPath = importMap.imports[specifier];
      if (mappedPath === undefined) {
        importMap.imports[specifier] = servedModulePath;
      }
      else if (mappedPath !== servedModulePath) {
        // Each importer records its own resolution, so whichever target wins
        // the top-level entry, the others stay correct through their scope.
        const scopePrefix = new URL('.', importerBaseUrl).pathname;
        (scopes[scopePrefix] ??= {})[specifier] = servedModulePath;
      }
      enqueue(servedModulePath);
    }));
  }

  const pageBaseUrl = new URL(pageServedPath, SERVED_PATH_BASE);
  let hasModuleScripts = false;
  let pageSourcePathPromise: Promise<string> | undefined;
  for (const scriptMatch of htmlContent.matchAll(MODULE_SCRIPT_REGEX)) {
    hasModuleScripts = true;
    const sourceAttribute = scriptMatch[1].match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    if (sourceAttribute) {
      enqueue(new URL(sourceAttribute[1], pageBaseUrl).pathname);
    }
    else if (scriptMatch[2]) {
      const inlineScriptBody = scriptMatch[2];
      pageSourcePathPromise ??= servedPathToSourcePath(pageServedPath, servedRoot);
      crawlTasks.push(pageSourcePathPromise
        .then(pageSourceFilePath => collectImports(inlineScriptBody, pageSourceFilePath, pageServedPath)));
    }
  }
  if (!hasModuleScripts) return importMap;

  // Elements pushed while awaiting are still visited: the array iterator
  // re-checks the length on every step.
  for (const crawlTask of crawlTasks) {
    await crawlTask;
  }

  // Import maps have no fallback for unmapped bare specifiers — a dynamic
  // import() of a computed name throws before any network request unless the
  // name is a map key. So every package name installed along the crawled
  // modules' node_modules chains gets an entry; names the crawl did not
  // already map point at the /@resolve/ route, which resolves them
  // server-side at import time. Intentional boundary: a module reached only
  // through /@resolve/ was never crawled, so names visible solely from its
  // own non-hoisted node_modules are not enumerated.
  const pageSourceFilePath = await (pageSourcePathPromise ?? servedPathToSourcePath(pageServedPath, servedRoot));
  visitedSourceDirectories.add(toPosixPath(dirname(pageSourceFilePath)));
  const nodeModulesDirectories = new Set<string>();
  for (const sourceDirectory of visitedSourceDirectories) {
    let currentDirectory = sourceDirectory;
    while (`${currentDirectory}/`.startsWith(rootDirectory)) {
      nodeModulesDirectories.add(`${currentDirectory}/node_modules`);
      currentDirectory = dirname(currentDirectory);
    }
  }
  const installedPackageNames = new Set<string>();
  await Promise.all(Array.from(nodeModulesDirectories, async (nodeModulesDirectory) => {
    const entryNames = await readdir(nodeModulesDirectory).catch((): string[] => []);
    await Promise.all(entryNames.map(async (entryName) => {
      if (entryName.startsWith('.')) return;
      if (entryName.startsWith('@')) {
        for (const scopedName of await readdir(`${nodeModulesDirectory}/${entryName}`).catch((): string[] => [])) {
          if (!scopedName.startsWith('.')) installedPackageNames.add(`${entryName}/${scopedName}`);
        }
      }
      else {
        installedPackageNames.add(entryName);
      }
    }));
  }));
  for (const packageName of installedPackageNames) {
    importMap.imports[packageName] ??= `${servedRoot}@resolve/${packageName}`;
    // Subpath imports (`package/sub`) route through the resolver too.
    importMap.imports[`${packageName}/`] ??= `${servedRoot}@resolve/${packageName}/`;
  }

  if (Object.keys(scopes).length) importMap.scopes = scopes;
  return importMap;
}

// Strip a mount prefix (e.g. `/damo`) from a request path, preserving any query
// string, so file serving and proxy rules work off the origin root. Returns the
// path unchanged when it doesn't fall under the prefix (or no base is set).
function stripBasePrefix(path: string, basePrefix: string): string {
  if (!basePrefix) return path;
  const queryIndex = path.indexOf('?');
  const pathOnly = queryIndex === -1 ? path : path.slice(0, queryIndex);
  const query = queryIndex === -1 ? '' : path.slice(queryIndex);
  if (pathOnly === basePrefix || pathOnly.startsWith(`${basePrefix}/`)) {
    return (pathOnly.slice(basePrefix.length) || '/') + query;
  }
  return path;
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
