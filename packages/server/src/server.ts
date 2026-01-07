import { FSWatcher, watch as chokidarWatch } from 'chokidar';
import { mkdir, readFile, stat, writeFile } from 'fs/promises';
import getPort, { portNumbers } from 'get-port';
import { constants, createSecureServer, type Http2SecureServer, type ServerHttp2Stream } from 'http2';
import { createServer } from 'https';
import { moduleResolve } from 'import-meta-resolve';
import mimeTypes from 'mime-types';
import { networkInterfaces as getNetworkInterfaces } from 'os';
import { extname } from 'path';
import { join } from 'path';
import QRCode from 'qrcode';
import { generate as generateSelfSignedCertificate } from 'selfsigned';
import { v5 as uuidv5 } from 'uuid';
import WebSocket, { WebSocketServer } from 'ws';

const rootDirectory = `${process.cwd()}/`.replaceAll(/\\/g, '/');
const importMetaResolveParent = new URL(`file:///${rootDirectory}`);
const certificatesDirectory = join(import.meta.dirname, '../certificates');

const resolveImports = async (string: string, removeCSSImportAttribute = false) => {
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
          importPath = moduleResolve(importPath, importMetaResolveParent, new Set(['module', 'import', 'default']), true).href.replace(
            importMetaResolveParent.href,
            '/',
          );
        }
        catch (error) {
          console.log(importPath, error);
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
};

type ServerOptions = {
  path?: string;
  watch?: boolean;
  rootPath?: string;
  resolveModules?: boolean;
  watchIgnore?: Array<string | RegExp>;
  verbose?: boolean;
  port?: number;
  useExternalCertificate?: boolean;
};

export class Server {
  http2SecureServer: Http2SecureServer;
  ready: Promise<void>;

  #wss: WebSocketServer;
  #watcher: FSWatcher;

  constructor(serverOptions: ServerOptions = {}) {
    this.ready = this.#setup(serverOptions);
  }

  async #setup({
    path = '',
    watch = false,
    rootPath = '.',
    resolveModules = false,
    watchIgnore = undefined,
    verbose = false,
    port = 3000,
    useExternalCertificate = false,
  }: ServerOptions = {}) {
    /**
     * Get port
     */
    const fromPort = port;
    const toPort = port + 100;
    const serverPort = await getPort({ port: portNumbers(fromPort, toPort) });
    const webSocketServerPort = await getPort({ port: portNumbers(fromPort, toPort) });

    /**
     * Get addresses
     */
    const addresses = ['localhost'];
    const networkInterfaces = getNetworkInterfaces();
    Object.values(networkInterfaces)
      .flat()
      .forEach((networkInterface) => {
        if (networkInterface.family === 'IPv4' && !networkInterface.internal) {
          addresses.push(networkInterface.address);
        }
      });

    /**
     * Create certificate for addresses
     */
    const certificateAdresses = useExternalCertificate ? addresses : ['localhost'];
    const adressesString = certificateAdresses.join('_');

    let [cert, key] = await Promise.all([
      readFile(`${certificatesDirectory}/${adressesString}.crt`, { encoding: 'utf-8' }),
      readFile(`${certificatesDirectory}/${adressesString}.key`, { encoding: 'utf-8' }),
    ]).catch(() => [undefined, undefined]);

    if (!key || !cert) {
      console.log('Creating certificate for', certificateAdresses);

      const pems = await generateSelfSignedCertificate([{ name: 'commonName', value: 'localhost' }],
        {
          keySize: 2048,
          extensions: [
            {
              name: 'subjectAltName',
              altNames: certificateAdresses.map((address) => {
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
        writeFile(`${certificatesDirectory}/${adressesString}.crt`, cert),
        writeFile(`${certificatesDirectory}/${adressesString}.key`, key),
      ]);
    }

    /**
     * Create HTTP2 Server
     */
    this.http2SecureServer = createSecureServer({
      cert,
      key,
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

        this.#watcher = chokidarWatch([], {
          ignored: watchIgnore,
          ignoreInitial: true,
          usePolling: true,
        })
          .on('change', (path) => {
            if (verbose) {
              console.log(`${path} just changed, refresh.`);
            }
            this.refresh();
          });
      }
    });

    this.http2SecureServer.on('stream', async (stream: ServerHttp2Stream, headers) => {
      if (headers[constants.HTTP2_HEADER_METHOD] !== constants.HTTP2_METHOD_GET) {
        return;
      }

      const requestAuthority = headers[constants.HTTP2_HEADER_AUTHORITY];
      const requestPath = headers[constants.HTTP2_HEADER_PATH];
      const requestRange = headers[constants.HTTP2_HEADER_RANGE];
      const userAgent = headers['user-agent'];
      const fetchDest = headers['sec-fetch-dest'];

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
       * Detect Safari browser to convert CSS imports to JS imports
       */
      const convertCSSImport = userAgent?.includes('Safari') && !userAgent.includes('Chrome');

      try {
        let filePath = `${rootPath}${requestPath}`;

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

        /**
         * If path is a directory then set index.html file by default
         */
        if ((await stat(filePath))?.isDirectory()) {
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

        this.#watcher?.add(filePath);

        const fileExtension = extname(filePath);

        /**
         * Add socket code on html pages for live reloading
         */
        if (watch && fileExtension === '.html') {
          stream.respond(responseHeaders);
          let fileContent = await readFile(filePath, {
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
        else if (resolveModules && (fileExtension === '.js' || fileExtension === '.mjs')) {
          stream.respond(responseHeaders);
          let fileContent = await readFile(filePath, {
            encoding: 'utf-8',
          });
          fileContent = await resolveImports(fileContent, convertCSSImport);
          stream.end(fileContent);
        }
        else if (fileExtension === '.css' && convertCSSImport && fetchDest === 'script') {
          responseHeaders['content-type'] = 'application/javascript';
          stream.respond(responseHeaders);
          let fileContent = await readFile(filePath, {
            encoding: 'utf-8',
          });
          fileContent = `const styles = new CSSStyleSheet();
styles.replaceSync(\`${fileContent.replaceAll(/[`$]/gm, '\\$&')}\`);
export default styles;`;
          stream.end(fileContent);
        }
        else {
          stream.respondWithFile(decodeURIComponent(filePath), responseHeaders);
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

    this.http2SecureServer.listen(serverPort);

    for (const [index, address] of addresses.entries()) {
      const url = `https://${address}:${serverPort}/${path}`;
      console.log(url);
      if (index !== 0) {
        console.log(await QRCode.toString(url, { type: 'terminal', small: true }));
      }
    }
  }

  refresh() {
    if (!this.#wss) return;
    for (const client of this.#wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send('refresh');
      }
    }
  }
}
