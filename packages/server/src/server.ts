import * as chokidar from 'chokidar';
import devcert from 'devcert';
import * as fs from 'fs/promises';
import getPort, { portNumbers } from 'get-port';
import * as http2 from 'http2';
import * as https from 'https';
import { moduleResolve } from 'import-meta-resolve';
import mimeTypes from 'mime-types';
import * as os from 'os';
import { extname } from 'path';
import WebSocket, { WebSocketServer } from 'ws';

const rootDirectory = `${process.cwd()}/`.replaceAll(/\\/g, '/');
const importMetaResolveParent = new URL(`file:///${rootDirectory}`);

const resolveImports = (string: string, removeCSSImportAttribute = false) => {
  string = string.replaceAll(
    /((?:\bimport\b|\bexport\b)(?:[{\s\w,*$}]*?from)?[\s(]+['"])(.*?)(['"])([\s]+with[\s]+{[\s]+type[\s]*:[\s]+['"](.*?)['"][\s]+})?/g,
    (match, p1, importPath, p3, p4, importAttribute) => {
      if (!/^[./]/.test(importPath)) {
        try {
          importPath = moduleResolve(importPath, importMetaResolveParent, new Set(['import']), true).href.replace(
            importMetaResolveParent.href,
            '/',
          );
          /**
           * Change to import.meta.resolve when we'll be able to choose to resolve only browser code.
           */
          // importPath = import.meta.resolve(importPath, importMetaResolveParent).replace(importMetaResolveParent.href, '/');
        } catch (error) {
          console.log(importPath, error);
        }
      }

      const removeImportAttribute = removeCSSImportAttribute && importAttribute === 'css';

      return p1 + importPath + p3 + (p4 && !removeImportAttribute ? p4 : '');
    },
  );
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
};

export class Server {
  http2SecureServer: http2.Http2SecureServer;
  ready: Promise<void>;

  #wss: WebSocketServer;
  #watcher: chokidar.FSWatcher;

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
  } = {}) {
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
    const networkInterfaces = os.networkInterfaces();
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
    const { key, cert } = await devcert.certificateFor(addresses[0]);

    /**
     * Create HTTP2 Server
     */
    this.http2SecureServer = http2.createSecureServer({
      key,
      cert,
    });

    this.http2SecureServer.on('error', (error) => {
      console.error(error);
    });

    this.http2SecureServer.on('listening', () => {
      if (watch) {
        /**
         * Create WebSocket server to refresh page on file change
         */
        const webSocketServer = https.createServer({
          key,
          cert,
        });
        this.#wss = new WebSocketServer({ server: webSocketServer });
        webSocketServer.listen(webSocketServerPort);

        this.#watcher = chokidar
          .watch(undefined, {
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

    this.http2SecureServer.on('stream', async (stream, headers) => {
      if (headers[http2.constants.HTTP2_HEADER_METHOD] !== http2.constants.HTTP2_METHOD_GET) {
        return;
      }

      const requestAuthority = headers[http2.constants.HTTP2_HEADER_AUTHORITY];
      const requestPath = headers[http2.constants.HTTP2_HEADER_PATH];
      const requestRange = headers[http2.constants.HTTP2_HEADER_RANGE];
      const userAgent = headers['user-agent'];
      const fetchDest = headers['sec-fetch-dest'];

      /**
       * Detect Safari browser to convert CSS imports to JS imports
       */
      const convertCSSImport = userAgent?.includes('Safari') && !userAgent.includes('Chrome');
      const importedFromScript = fetchDest === 'script';

      try {
        let filePath = `${rootPath}${requestPath}`;

        const responseHeaders = {
          ':status': http2.constants.HTTP_STATUS_OK,
          'content-type': String(mimeTypes.lookup(filePath)),
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Embedder-Policy': 'require-corp',
          'Cross-Origin-Resource-Policy': 'cross-origin',
          ...(requestRange ? { 'Accept-Ranges': 'bytes' } : {}),
        };

        /**
         * Rewrite to root if url isn't a file and doesn't exist
         */
        try {
          if (!/\.[^/]*$/.test(filePath) && !(await fs.stat(filePath))) {
            throw new Error();
          }
        } catch (error) {
          filePath = `${rootPath}/`;
        }

        /**
         * If path is a directory then set index.html file by default
         */
        if ((await fs.stat(filePath))?.isDirectory()) {
          filePath += filePath.endsWith('/') ? 'index.html' : '/index.html';
        }

        this.#watcher?.add(filePath);

        const fileExtension = extname(filePath);

        /**
         * Add socket code on html pages for live reloading
         */
        if (watch && fileExtension === '.html') {
          stream.respond(responseHeaders);
          let fileContent = await fs.readFile(filePath, {
            encoding: 'utf-8',
          });
          if (resolveModules) {
            fileContent = resolveImports(fileContent, convertCSSImport);
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
        } else if (resolveModules && (fileExtension === '.js' || fileExtension === '.mjs')) {
          stream.respond(responseHeaders);
          let fileContent = await fs.readFile(filePath, {
            encoding: 'utf-8',
          });
          fileContent = resolveImports(fileContent, convertCSSImport);
          stream.end(fileContent);
        } else if (fileExtension === '.css' && convertCSSImport && importedFromScript) {
          responseHeaders['content-type'] = 'application/javascript';
          stream.respond(responseHeaders);
          let fileContent = await fs.readFile(filePath, {
            encoding: 'utf-8',
          });
          fileContent = `const styles = new CSSStyleSheet();
styles.replaceSync(\`${fileContent.replaceAll(/[`$]/gm, '\\$&')}\`);
export default styles;`;
          stream.end(fileContent);
        } else {
          stream.respondWithFile(decodeURIComponent(filePath), responseHeaders);
        }
      } catch (error) {
        console.log(error);

        if (stream.closed) return;

        if (error.code === 'ENOENT') {
          stream.respond({ ':status': http2.constants.HTTP_STATUS_NOT_FOUND });
        } else {
          stream.respond({
            ':status': http2.constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
          });
        }
        stream.end();
      }

      stream.on('error', (error) => {
        console.log(error);
      });
    });

    this.http2SecureServer.listen(serverPort);

    for (const address of addresses) {
      console.log(`https://${address}:${serverPort}/${path}`);
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
