import Graph from './Graph.js';

// let webSocket

const graphs = new Map();

export const getGraph = (name) => {
  let graph = graphs.get(name);
  if (!graph) {
    graph = new Graph(name);
    graphs.set(name, graph);
  }
  return graph;
};

// if (!webSocket) {
//   webSocket = new WebSocket('wss://localhost:3060')
//   webSocket.addEventListener('open', function (event) {
//     webSocket.send('Hello Server!')
//   })
// }
// webSocket.addEventListener('message', function (event) {
//   console.log('Message from server ', event.data)
// })
