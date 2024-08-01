import { Signal } from '@damienmortini/signal';

class Ticker extends Signal {
  static #BASE_DELTA_TIME = 1000 / 60;
  #time;
  #previousTime;
  #currentAnimationFrame;

  constructor() {
    super();

    this.#reset();

    document.addEventListener('visibilitychange', () => {
      this.#reset();
    });
  }

  add(value) {
    if (!this.size) {
      this.#reset();
      this.#update();
    }
    return super.add(value);
  }

  delete(value) {
    const returnValue = super.delete(value);
    if (!this.size) cancelAnimationFrame(this.#currentAnimationFrame);
    return returnValue;
  }

  clear() {
    cancelAnimationFrame(this.#currentAnimationFrame);
    super.clear();
  }

  #reset() {
    this.#time = this.#previousTime = window.performance.now();
    this.deltaTime = Ticker.#BASE_DELTA_TIME;
    this.smoothDeltatime = this.deltaTime;
    this.timeScale = 1;
    this.smoothTimeScale = this.timeScale;
  }

  #update = () => {
    this.#currentAnimationFrame = requestAnimationFrame(this.#update);

    this.#time = window.performance.now();
    this.deltaTime = this.#time - this.#previousTime;
    this.smoothDeltatime += (this.deltaTime - this.smoothDeltatime) * 0.05;
    this.timeScale = this.deltaTime / Ticker.#BASE_DELTA_TIME;
    this.smoothTimeScale = this.smoothDeltatime / Ticker.#BASE_DELTA_TIME;
    this.#previousTime = this.#time;

    this.dispatch();
  };
}

export default new Ticker();
