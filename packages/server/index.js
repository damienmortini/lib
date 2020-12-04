#!/usr/bin/env node

import https from 'https';
import http2 from 'http2';
import fs from 'fs';
import chokidar from 'chokidar';
import mimeTypes from 'mime-types';
import WebSocket from 'ws';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Extract parameters
 */
let verbose = false;
let path = '';
let watchPath = '.';

for (const arg of process.argv) {
  if (arg.startsWith('--path')) {
    path = arg.split('=')[1].trim();
  } else if (arg.startsWith('--watchpath')) {
    watchPath = arg.split('=')[1].trim();
  } else if (arg === '--verbose') {
    verbose = true;
  }
}

/**
 * Create HTTP2 Server
 */
const server = http2.createSecureServer({
  key: fs.readFileSync(`${__dirname}/server.key`),
  cert: fs.readFileSync(`${__dirname}/server.crt`),
}, (request, response) => {
  const url = `.${request.url}`;
  if (fs.existsSync(url) && fs.statSync(url).isDirectory() && !request.url.endsWith('/')) {
    response.writeHead(301, {
      'Location': `${request.url}/`,
    });
    response.end();
  }
});

let port = 3000;

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    port++;
    server.listen(port);
  } else {
    console.error(error);
  }
});

server.on('listening', () => {
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

  /**
   * Create WebSocket server to reload page on file change
   */
  const webSocketServer = https.createServer({
    key: fs.readFileSync(`${__dirname}/server.key`),
    cert: fs.readFileSync(`${__dirname}/server.crt`),
  });
  const wss = new WebSocket.Server({ server: webSocketServer });
  webSocketServer.listen(++port);

  chokidar.watch(watchPath).on('change', (path) => {
    if (verbose) {
      console.log(`${path} just changed, reload.`);
    }
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send('reload');
      }
    }
  });
});

server.on('stream', (stream, headers) => {
  const requestAuthority = headers[http2.constants.HTTP2_HEADER_AUTHORITY];
  const requestScheme = headers[http2.constants.HTTP2_HEADER_SCHEME];
  const requestPath = headers[http2.constants.HTTP2_HEADER_PATH];
  const requestRange = headers[http2.constants.HTTP2_HEADER_RANGE];

  const url = new URL(`${requestScheme}://${requestAuthority}${requestPath}`);

  let filePath = `.${url.pathname}`;

  /**
   * Rewrite to root if url doesn't exist and isn't a file
   */
  if (!/\.[^\/]*$/.test(filePath) && !fs.existsSync(filePath)) {
    filePath = './';
  }

  /**
   * If path is a directory then set index.html file by default
   */
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath += 'index.html';
  }

  /**
   * Add socket code on html pages for live reloading
   */
  if (filePath.endsWith('.html')) {
    try {
      let fileContent = fs.readFileSync(filePath, {
        encoding: 'utf-8',
      });
      fileContent = fileContent.replace('</body>', `
  <script>
    const socket = new WebSocket("wss://${requestAuthority.split(':')[0]}:${port}");
    socket.addEventListener("message", function (event) {
      window.location.reload();
    });
  </script>
</body>`);
      stream.end(fileContent);
    } catch (error) {
      if (error.code === 'ENOENT') {
        stream.respond({ ':status': http2.constants.HTTP_STATUS_NOT_FOUND });
      } else {
        stream.respond({ ':status': http2.constants.HTTP_STATUS_INTERNAL_SERVER_ERROR });
      }
      stream.end();
    }
  } else {
    const responseHeaders = {
      'content-type': String(mimeTypes.lookup(filePath)),
    };
    if (requestRange) {
      responseHeaders['Accept-Ranges'] = 'bytes';
    }
    stream.respondWithFile(filePath, responseHeaders, {
      onError: (error) => {
        if (error.code === 'ENOENT') {
          stream.respond({ ':status': http2.constants.HTTP_STATUS_NOT_FOUND });
        } else {
          stream.respond({ ':status': http2.constants.HTTP_STATUS_INTERNAL_SERVER_ERROR });
        }
        stream.end();
      },
    });
  }
});

server.listen(port);
