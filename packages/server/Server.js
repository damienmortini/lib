import * as https from 'https'
import * as http2 from 'http2'
import * as fs from 'fs'
import * as chokidar from 'chokidar'
import mimeTypes from 'mime-types'
import WebSocket, { WebSocketServer } from 'ws'
import * as os from 'os'

import { fileURLToPath } from 'url'
import { dirname, extname } from 'path'
import * as esbuild from 'esbuild'

const directoryName = dirname(fileURLToPath(import.meta.url))

const rootDirectory = `${process.cwd()}/`.replaceAll(/\\/g, '/')
const resolveImports = (string) => {
  string = string.replaceAll(/((?:\bimport\b|\bexport\b)(?:[{\s\w,*$}]*?from)?[\s(]+['"])(.*?)(['"])/g, (match, p1, importPath, p3) => {
    const [, packageName, filePath] = /^(?![./])((?:@.*?\/)?.*?)(?:\/|$)(.*)/.exec(importPath) ?? []

    if (packageName) {
      const packagePath = `node_modules/${packageName}`
      const packageJSON = JSON.parse(fs.readFileSync(`${rootDirectory}${packagePath}/package.json`, 'utf8'))
      const mainFileName = filePath || packageJSON.module || packageJSON.main || 'index.js'
      importPath = `${packagePath}/${mainFileName}`
      if (!importPath.endsWith('.js') && fs.existsSync(`${rootDirectory}${importPath}/package.json`)) {
        const packageJSON = JSON.parse(fs.readFileSync(`${rootDirectory}${importPath}/package.json`, 'utf8'))
        importPath = `${importPath}/${packageJSON.module || packageJSON.main || 'index.js'}`
      }
      importPath = `/${importPath}`
    }

    return p1 + importPath + p3
  })
  return string
}

export default class Server {
  http2SecureServer
  #wss

  constructor({
    path = '',
    watch = false,
    watchPath = '',
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
      key: fs.readFileSync(`${directoryName}/server.key`),
      cert: fs.readFileSync(`${directoryName}/server.crt`),
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
      this.#wss = new WebSocketServer({ server: webSocketServer })
      webSocketServer.listen(++port)

      if (watch) {
        chokidar
          .watch(`${rootPath}${watchPath}`, {
            ignored: watchIgnore,
            ignoreInitial: true,
          })
          .on('change', (path) => {
            if (verbose) {
              console.log(`${path} just changed, refresh.`)
            }
            this.refresh()
          })
      }
    })

    this.http2SecureServer.on('stream', (stream, headers) => {
      if (headers[http2.constants.HTTP2_HEADER_METHOD] !== http2.constants.HTTP2_METHOD_GET) {
        return
      }

      const requestAuthority = headers[http2.constants.HTTP2_HEADER_AUTHORITY]
      const requestPath = headers[http2.constants.HTTP2_HEADER_PATH]
      const requestRange = headers[http2.constants.HTTP2_HEADER_RANGE]

      try {
        let filePath = `${rootPath}${requestPath}`

        /**
         * Try .ts if .js doesn't exist
         */
        if (!fs.existsSync(filePath) && filePath.endsWith('.js')) {
          filePath = filePath.replace(/\.js$/, '.ts')
        }

        /**
         * Rewrite to root if url doesn't exist and isn't a file
         */
        if (!fs.existsSync(filePath) && !/\.[^/]*$/.test(filePath)) {
          filePath = `${rootPath}/`
        }

        /**
         * If path is a directory then set index.html file by default
         */
        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          filePath += filePath.endsWith('/') ? 'index.html' : '/index.html'
        }

        const fileExtension = extname(filePath)
        /**
         * Add socket code on html pages for live reloading
         */
        switch (fileExtension) {
          case '.html':
            {
              let fileContent = fs.readFileSync(filePath, {
                encoding: 'utf-8',
              })
              if (resolveModules) {
                fileContent = resolveImports(fileContent)
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
              )
              stream.end(fileContent)
            }
            break
          case '.js':
          case '.ts':
          case '.mjs':
            {
              let fileContent = fs.readFileSync(filePath, {
                encoding: 'utf-8',
              })
              stream.respond({
                ':status': 200,
                'content-type': mimeTypes.contentType('.js'),
              })
              if (fileExtension === '.ts') {
                fileContent = esbuild.transformSync(fileContent, {
                  loader: 'ts',
                }).code
              }
              if (resolveModules) {
                fileContent = resolveImports(fileContent)
              }
              stream.end(fileContent)
            }
            break
          default:
            {
              const responseHeaders = {
                'content-type': String(mimeTypes.lookup(filePath)),
              }
              if (requestRange) {
                responseHeaders['Accept-Ranges'] = 'bytes'
              }
              stream.respondWithFile(decodeURIComponent(filePath), responseHeaders)
            }
            break
        }
      } catch (error) {
        if (verbose) console.log(error)
        if (error.code === 'ENOENT') {
          stream.respond({ ':status': http2.constants.HTTP_STATUS_NOT_FOUND })
        } else {
          stream.respond({
            ':status': http2.constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
          })
        }
        stream.end()
      }

      stream.on('error', (error) => {
        if (verbose) console.log(error)
      })
    })

    this.http2SecureServer.listen(port)
  }

  refresh() {
    for (const client of this.#wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send()
      }
    }
  }
}
