import CustomElement from "./CustomElement.js";

export default class LoopElement extends CustomElement {
  createdCallback() {
    super.createdCallback();
    this._updateBinded = this.update.bind(this);
  }

  attachedCallback() {
    window.addEventListener("blur", this._stopBinded = this.stop.bind(this));
    window.addEventListener("focus", this._startBinded = this.start.bind(this));
    this.start();
  }

  detachedCallback() {
    this.stop();
    window.removeEventListener("blur", this._stopBinded);
    window.removeEventListener("focus", this._startBinded);
  }

  start() {
    this.stop();
    this.update();
  }

  stop() {
    cancelAnimationFrame(this._requestAnimationFrameId);
  }

  update() {
    this._requestAnimationFrameId = requestAnimationFrame(this._updateBinded);
  }
}
