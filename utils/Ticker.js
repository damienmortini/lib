const callbacks = [];

class Ticker {
  constructor() {
    this._updateBinded = this.update.bind(this);

    this._previousTimestamp = 0;
    this.deltaTime = 0;

    this.update();
  }

  update(time) {
    this._requestAnimationFrameID = requestAnimationFrame(this._updateBinded);

    let timestamp = window.performance ? window.performance.now() : Date.now();
    this.deltaTime = timestamp - this._previousTimestamp;
    this._previousTimestamp = timestamp;

    for (let callback of callbacks) {
      callback();
    }
  }

  add(callback) {
    this.remove(callbacks.indexOf(callback));

    callbacks.push(callback);

    return callbacks.length - 1;
  }

  remove(id) {
    if(id < 0) {
      return;
    }
    callbacks.splice(id, 1);
  }
}

export default new Ticker();
