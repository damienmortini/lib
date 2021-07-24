import https from 'https'
import http2 from 'http2'
import fs from 'fs'
import chokidar from 'chokidar'
import mimeTypes from 'mime-types'
import WebSocket from 'ws'
import os from 'os'

import { fileURLToPath } from 'url'
import { dirname } from 'path'

const directoryName = dirname(fileURLToPath(import.meta.url))

export default class Server {
  constructor({ path = '', watch = false, watchPath = '', watchIgnore = undefined, verbose = false, port = 3000 } = {}) {
    /**
     * Create HTTP2 Server
     */
    this.http2SecureServer = http2.createSecureServer({
      key: fs.readFileSync(`${directoryName}/server.key`),
      cert: fs.readFileSync(`${directoryName}/server.crt`),
    }, (request, response) => {
      const url = `.${request.url}`
      if (fs.existsSync(url) && fs.statSync(url).isDirectory() && !request.url.endsWith('/')) {
        response.writeHead(301, {
          'Location': `${request.url}/`,
        })
        response.end()
      }
    })

    this.http2SecureServer.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        port++
        this.http2SecureServer.listen(port)
      } else {
        console.error(error)
      }
    })

    this.http2SecureServer.on('listening', () => {
      /**
       * Log currently used URLs
       */
      const networkInterfaces = os.networkInterfaces()
      console.log(`https://localhost:${port}/${path}`)
      for (const key of Object.keys(networkInterfaces)) {
        const networkInterfacesArray = networkInterfaces[key]
        for (const networkInterface of networkInterfacesArray) {
          if (networkInterface.family !== 'IPv4' || networkInterface.internal) {
            continue
          }
          console.log(`https://${networkInterface.address}:${port}/${path}`)
        }
      }
      console.log('\n')

      /**
       * Create WebSocket server to refresh page on file change
       */
      const webSocketServer = https.createServer({
        key: fs.readFileSync(`${directoryName}/server.key`),
        cert: fs.readFileSync(`${directoryName}/server.crt`),
      })
      this._wss = new WebSocket.Server({ server: webSocketServer })
      webSocketServer.listen(++port)

      if (watch) {
        chokidar.watch(watchPath, {
          ignored: watchIgnore,
          ignoreInitial: true,
        }).on('change', (path) => {
          if (verbose) {
            console.log(`${path} just changed, refresh.`)
          }
          this.refresh()
        })
      }
    })

    this.http2SecureServer.on('stream', (stream, headers) => {
      const requestAuthority = headers[http2.constants.HTTP2_HEADER_AUTHORITY]
      const requestScheme = headers[http2.constants.HTTP2_HEADER_SCHEME]
      const requestPath = headers[http2.constants.HTTP2_HEADER_PATH]
      const requestRange = headers[http2.constants.HTTP2_HEADER_RANGE]

      const url = new URL(`${requestScheme}://${requestAuthority}${requestPath}`)

      let filePath = `.${url.pathname}`

      /**
       * Rewrite to root if url doesn't exist and isn't a file
       */
      if (!/\.[^/]*$/.test(filePath) && !fs.existsSync(filePath)) {
        filePath = './'
      }

      /**
       * If path is a directory then set index.html file by default
       */
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath += filePath.endsWith('/') ? 'index.html' : '/index.html'
      }

      try {
        /**
         * Add socket code on html pages for live reloading
         */
        if (filePath.endsWith('.html')) {
          let fileContent = fs.readFileSync(filePath, {
            encoding: 'utf-8',
          })
          fileContent = fileContent.replace('</body>', `<script>
  const socket = new WebSocket("wss://${String(requestAuthority).split(':')[0]}:${port}");
  socket.addEventListener("message", function (event) {
    window.location.reload();
  });
</script>
</body>`)
          stream.end(fileContent)
        } else {
          const responseHeaders = {
            'content-type': String(mimeTypes.lookup(filePath)),
          }
          if (requestRange) {
            responseHeaders['Accept-Ranges'] = 'bytes'
          }
          stream.respondWithFile(decodeURIComponent(filePath), responseHeaders)
        }
      } catch (error) {
        if (error.code === 'ENOENT') {
          stream.respond({ ':status': http2.constants.HTTP_STATUS_NOT_FOUND })
        } else {
          stream.respond({ ':status': http2.constants.HTTP_STATUS_INTERNAL_SERVER_ERROR })
        }
        stream.end()
      }
    })

    this.http2SecureServer.listen(port)
  }

  refresh() {
    for (const client of this._wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send()
      }
    }
  }
}
