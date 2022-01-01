import { Server } from '@damienmortini/server'

import { WebSocketServer } from 'ws'

export default class GraphServer {
  constructor() {
    const wss = new WebSocketServer({ server: new Server({ port: 3060 }).http2SecureServer })

    wss.on('connection', function connection(ws) {
      ws.on('message', function message(data) {
        console.log('received: %s', data)
      })

      ws.send('something')
    })
  }
}
