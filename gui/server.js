const WebSocket = require("ws");
const WebSocketServer = WebSocket.Server;

let webSocketServer = new WebSocketServer({port: 8080});
webSocketServer.on("connection", function connection(webSocket) {
  console.log("Connected");
  webSocket.on("message", function (message) {
    for (let client of webSocketServer.clients) {
      // if(client.readyState !== WebSocket.OPEN) {
      //   return;
      // }
      client.send(message, (err) => {
        if(err) {
          console.log(err);
        }
      });
    }
  });
});
