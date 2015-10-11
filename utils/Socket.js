import EventEmitter from "event-emitter";

export default class Socket {
  constructor(url, protocols) {
    this._webSocket = new WebSocket(url, protocols);
    this._webSocket.onopen = this.onOpen.bind(this);
    this._webSocket.onerror = this.onError.bind(this);
    this._webSocket.onmessage = this.onMessage.bind(this);

    this._eventEmitter = new EventEmitter();

    this._objectsQueue = [];
  }
  send(type, data) {
    let object = {type, data};
    this._objectsQueue.push(object);
    this._sendQueue();
  }
  _sendQueue() {
    if(this._webSocket.readyState === WebSocket.OPEN) {
      while(this._objectsQueue.length) {
        this._webSocket.send(JSON.stringify(this._objectsQueue[0]));
        this._objectsQueue.shift();
      }
    }
  }
  onOpen() {
    console.log("WebSocket opened");
    this._sendQueue();
  };
  onError(error) {
    console.log("WebSocket Error " + error);
  };
  onMessage(e) {
    console.log(e);
    let message = JSON.parse(e.data);
    this._eventEmitter.emit(message.type, message.data);
  };
  on(type, listener) {
    this._eventEmitter.on(type, listener);
  }
}
