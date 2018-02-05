import Signal from "./Signal.js";

class Ticker extends Signal {
  constructor() {
    super();
    
    this._updateBinded = this.update.bind(this);

    this._previousTimestamp = window.performance.now();
    this.deltaTime = 0;
    this.timeScale = 1;

    this.update();
  }

  update(time) {
    requestAnimationFrame(this._updateBinded);

    const timestamp = window.performance.now();
    this.deltaTime = (timestamp - this._previousTimestamp) * .001;
    this.timeScale = this.deltaTime / .0166666667;
    this._previousTimestamp = timestamp;

    this.dispatch(time);
  }
}

export default new Ticker();
