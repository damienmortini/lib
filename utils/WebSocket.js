const QUEUES = new Map();

export default class WebSocket extends window.WebSocket {
  constructor() {
    super(...arguments);

    QUEUES.set(this, []);

    const sendQueue = () => {
      this.removeEventListener("open", sendQueue);
      for (let data of QUEUES.get(this)) {
        this.send(data);
      }
      QUEUES.delete(this);
    }
    this.addEventListener("open", sendQueue);
  }

  send(data) {
    if(this.readyState === WebSocket.CONNECTING) {
      QUEUES.get(this).push(data);
    } else {
      super.send(data);
    }
  }
}
