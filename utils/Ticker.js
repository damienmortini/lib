let callbacks = [];
let scopes = [];

class Ticker {
  constructor() {
    this._updateBinded = this.update.bind(this);

    this._previousTimestamp = 0;
    this.deltaTime = 0;

    this.update();
  }

  update(time) {
    this._requestAnimationFrameId = requestAnimationFrame(this._updateBinded);

    let timestamp = window.performance ? window.performance.now() : Date.now();
    this.deltaTime = timestamp - this._previousTimestamp;
    this._previousTimestamp = timestamp;

    for (let [i, callback] of callbacks.entries()) {
      callback.call(scopes[i], time);
    }
  }

  add(callback, scope) {
    callbacks.push(callback);
    scopes.push(scope);
  }

  remove(callback) {
    var index = callbacks.indexOf(callback);
    callbacks.splice(index, 1);
    scopes.splice(index, 1);
  }
}

export default new Ticker();
