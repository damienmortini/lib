import CustomElement from "./CustomElement.js";

export default class LoopElement extends CustomElement {
  createdCallback({autostart = true} = {}) {
    super.createdCallback();
    this._updateBinded = this.update.bind(this);

    this.autostart = autostart;

    this._previousTimestamp = 0;
    this.deltaTime = 0;
  }

  attachedCallback() {
    window.addEventListener("blur", this._stopBinded = this.stop.bind(this));
    window.addEventListener("focus", this._startBinded = this.start.bind(this));
    if(this.autostart) {
      this.start();
    }
  }

  detachedCallback() {
    this.stop();
    window.removeEventListener("blur", this._stopBinded);
    window.removeEventListener("focus", this._startBinded);
  }

  start() {
    this.stop();
    this._previousTimestamp = window.performance ? window.performance.now() : Date.now();
    this.update();
  }

  stop() {
    cancelAnimationFrame(this._requestAnimationFrameId);
  }

  update() {
    this._requestAnimationFrameId = requestAnimationFrame(this._updateBinded);

    let timestamp = window.performance ? window.performance.now() : Date.now();
    this.deltaTime = timestamp - this._previousTimestamp;
    this._previousTimestamp = timestamp;
  }
}
