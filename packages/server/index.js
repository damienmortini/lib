#!/usr/bin/env node

const https = require('https');
const http2 = require('http2');
const fs = require('fs');
const mimeTypes = require('mime-types');
const WebSocket = require('ws');
const os = require('os');

/**
 * Extract parameters
 */
let verbose = false;
let path = '';

for (const arg of process.argv) {
  if (arg.startsWith('--path')) {
    path = arg.split('=')[1].trim();
  } else if (arg === '--verbose') {
    verbose = true;
  }
}

/**
 * Create HTTP2 Server
 */
const server = http2.createSecureServer({
  key: fs.readFileSync(`${__dirname}/../server.key`),
  cert: fs.readFileSync(`${__dirname}/../server.crt`),
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
    key: fs.readFileSync(`${__dirname}/../server.key`),
    cert: fs.readFileSync(`${__dirname}/../server.crt`),
  });
  const wss = new WebSocket.Server({ server: webSocketServer });
  webSocketServer.listen(++port);

  fs.watch('.', { recursive: true }, (eventType, filename) => {
    if (!filename || filename.startsWith('.git')) {
      return;
    }
    if (verbose) {
      console.log(`${filename} just changed, reload.`);
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

  const url = new URL(`${requestScheme}://${requestAuthority}${requestPath}`);

  let filePath = `.${url.pathname}`;

  /**
   * If path is a directory then set index.html file by default
   */
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    if (!filePath.endsWith('/')) {
      return;
    }
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
    const socket = new WebSocket("wss://${requestAuthority.split(':')[0]}:3001");
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
    const responseMimeType = String(mimeTypes.lookup(filePath));
    stream.respondWithFile(filePath, {
      'content-type': responseMimeType,
    }, {
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
