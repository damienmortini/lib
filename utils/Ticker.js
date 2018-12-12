import Signal from "./Signal.js";

class Ticker extends Signal {
  constructor() {
    super();

    this._updateBinded = this._update.bind(this);

    this.time = window.performance.now() * .001;
    this._previousTime = this.time;
    this.deltaTime = 0;
    this.timeScale = 1;

    this._update();
  }

  _update() {
    requestAnimationFrame(this._updateBinded);

    this.time = window.performance.now() * 0.001;
    this.deltaTime = this.time - this._previousTime;
    this.timeScale = this.deltaTime / .0166666667;
    this._previousTime = this.time;

    this.dispatch();
  }
}

export default new Ticker();
