class Ticker {
  constructor() {
    this._updateBinded = this.update.bind(this);

    this.callbacks = new Set();

    this._previousTimestamp = 0;
    this.deltaTime = 0;
    this.timeScale = 1;

    this.update();
  }

  update(time) {
    requestAnimationFrame(this._updateBinded);

    let timestamp = window.performance ? window.performance.now() : Date.now();
    this.deltaTime = (timestamp - this._previousTimestamp) * .001;
    this.timeScale = this.deltaTime / .0166666667;
    this._previousTimestamp = timestamp;

    for (let callback of this.callbacks) {
      callback(time);
    }
  }

  add(callback) {
    this.callbacks.add(callback);
  }

  remove(callback) {
    this.callbacks.delete(callback);
  }
}

export default new Ticker();
