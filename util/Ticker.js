import Signal from "./Signal.js";

const DELTA_TIME_BASE = 1 / 60;

class Ticker extends Signal {
  constructor() {
    super();

    this._updateBinded = this._update.bind(this);

    this.time = window.performance.now() * .001;
    this.reset();

    document.addEventListener("visibilitychange", () => {
      this.reset();
    });

    this._update();
  }

  reset() {
    this._previousTime = window.performance.now() * .001;
    this.deltaTime = DELTA_TIME_BASE;
    this.smoothDeltatime = this.deltaTime;
    this.timeScale = 1;
    this.smoothTimeScale = this.timeScale;
  }

  _update() {
    requestAnimationFrame(this._updateBinded);

    this.time = window.performance.now() * 0.001;
    this.deltaTime = this.time - this._previousTime;
    this.smoothDeltatime += (this.deltaTime - this.smoothDeltatime) * .05;
    this.timeScale = this.deltaTime / DELTA_TIME_BASE;
    this.smoothTimeScale = this.smoothDeltatime / DELTA_TIME_BASE;
    this._previousTime = this.time;

    this.dispatch();
  }
}

export default new Ticker();
