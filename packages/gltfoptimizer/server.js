import http2 from 'http2'
import { Buffer } from 'buffer'
import { NodeIO } from '@gltf-transform/core'
import { dedup, quantize, weld } from '@gltf-transform/functions'

const io = new NodeIO()

import { Server } from '../server/index.js'
const server = new Server({
  watch: true,
})

server.http2SecureServer.on('stream', (stream, headers) => {
  if (headers[http2.constants.HTTP2_HEADER_METHOD] !== http2.constants.HTTP2_METHOD_POST) return
  const buffers = []
  stream.on('data', (chunk) => {
    buffers.push(chunk)
  })
  stream.on('end', async (chunk) => {
    const glb = Buffer.concat(buffers)
    // io.readBinary(glb)
    const document = io.readJSON({
      json: JSON.parse(glb.toString()),
      resources: {},
    })

    await document.transform(
      weld(),
      quantize(),
      dedup(),
    )

    // io.write('output.glb', document)
    stream.respond({ ':status': 200 })
    console.log(io.writeBinary(document))
    stream.end(Buffer.from(io.writeBinary(document)))
    // stream.end('yo')
  })
})
