export default class WebSocketWithQueue extends WebSocket {
  constructor(url, protocols) {
    super(url, protocols);

    this._queue = [];

    const sendQueue = () => {
      while (this._queue.length) {
        this.send(this._queue.shift());
      }
    }
    this.addEventListener("open", sendQueue);
  }

  send(data) {
    if (this.readyState !== WebSocket.OPEN) {
      this._queue.push(data);
    } else {
      super.send(data);
    }
  }
}