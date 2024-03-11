import * as https from 'https';
import * as http2 from 'http2';
import * as fs from 'fs/promises';
import * as chokidar from 'chokidar';
import mimeTypes from 'mime-types';
import WebSocket, { WebSocketServer } from 'ws';
import * as os from 'os';

import { fileURLToPath } from 'url';
import { dirname, extname } from 'path';

const directoryName = dirname(fileURLToPath(import.meta.url));

const serverKey = await fs.readFile(`${directoryName}/server.key`);
const serverCrt = await fs.readFile(`${directoryName}/server.crt`);

const rootDirectory = `${process.cwd()}/`.replaceAll(/\\/g, '/');
const importMetaResolveParent = `file:///${rootDirectory}`;
const resolveImports = (string) => {
  string = string.replaceAll(/((?:\bimport\b|\bexport\b)(?:[{\s\w,*$}]*?from)?[\s(]+['"])(.*?)(['"])/g, (match, p1, importPath, p3) => {
    if (!/^[./]/.test(importPath)) {
      try {
        importPath = import.meta.resolve(importPath, importMetaResolveParent).replace(importMetaResolveParent, '/');
      } catch (error) {
        console.log(importPath, error);
      }
    }

    return p1 + importPath + p3;
  });
  return string;
};

export default class Server {
  http2SecureServer;
  #wss;
  #watcher;

  constructor({
    path = '',
    watch = false,
    rootPath = '.',
    resolveModules = false,
    watchIgnore = undefined,
    verbose = false,
    port = 3000,
  } = {}) {
    /**
     * Create HTTP2 Server
     */
    this.http2SecureServer = http2.createSecureServer({
      key: serverKey,
      cert: serverCrt,
    });

    this.http2SecureServer.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        port++;
        this.http2SecureServer.listen(port);
      } else {
        console.error(error);
      }
    });

    this.http2SecureServer.on('listening', () => {
      /**
       * Log currently used URLs
       */
      const networkInterfaces = os.networkInterfaces();
      console.log(`https://localhost:${port}/${path}`);
      for (const key of Object.keys(networkInterfaces)) {
        const networkInterfacesArray = networkInterfaces[key];
        for (const networkInterface of networkInterfacesArray) {
          if (networkInterface.family !== 'IPv4' || networkInterface.internal) {
            continue;
          }
          console.log(`https://${networkInterface.address}:${port}/${path}`);
        }
      }
      console.log('\n');

      if (watch) {
        /**
         * Create WebSocket server to refresh page on file change
         */
        const webSocketServer = https.createServer({
          key: serverKey,
          cert: serverCrt,
        });
        this.#wss = new WebSocketServer({ server: webSocketServer });
        webSocketServer.listen(++port);

        this.#watcher = chokidar
          .watch(undefined, {
            ignored: watchIgnore,
            ignoreInitial: true,
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

      try {
        let filePath = `${rootPath}${requestPath}`;

        const responseHeaders = {
          ':status': http2.constants.HTTP_STATUS_OK,
          'content-type': String(mimeTypes.lookup(filePath)),
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Embedder-Policy': 'require-corp',
          ...(requestRange ? { 'Accept-Ranges': 'bytes' } : {}),
        };

        /**
         * Rewrite to root if url doesn't exist and isn't a file
         */
        if (!(await fs.stat(filePath)) && !/\.[^/]*$/.test(filePath)) {
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
            fileContent = resolveImports(fileContent);
          }
          fileContent = fileContent.replace(
            '</body>',
            `<script>
const socket = new WebSocket("wss://${String(requestAuthority).split(':')[0]}:${port}");
socket.addEventListener("message", function (event) {
  window.location.reload();
});
</script>
</body>`,
          );
          stream.end(fileContent);
        } else if (resolveModules && (fileExtension === '.js' || fileExtension === '.mjs')) {
          stream.respond(responseHeaders);
          let fileContent = await fs.readFile(filePath, {
            encoding: 'utf-8',
          });
          fileContent = resolveImports(fileContent);
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

    this.http2SecureServer.listen(port);
  }

  refresh() {
    if (!this.#wss) return;
    for (const client of this.#wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send();
      }
    }
  }
}
