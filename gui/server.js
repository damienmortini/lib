const WebSocket = require("ws");
const WebSocketServer = WebSocket.Server;

let webSocketServer = new WebSocketServer({port: 80});
webSocketServer.on("connection", function connection(webSocket) {
  console.log("GUI Connected");
  webSocket.on("message", function (message) {
    for (let client of webSocketServer.clients) {
      client.send(message, (err) => {
        if(err) {
          console.log(err);
        }
      });
    }
  });
});
