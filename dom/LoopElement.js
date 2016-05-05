import Ticker from "../utils/Ticker.js";

import CustomElement from "./CustomElement.js";

export default class LoopElement extends CustomElement {
  createdCallback({autostart = true} = {}) {
    super.createdCallback();
    this._autostart = autostart;
  }

  attachedCallback() {
    window.addEventListener("blur", this._stopBinded = this.stop.bind(this));
    window.addEventListener("focus", this._startBinded = this.start.bind(this));
    if(this._autostart) {
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
    Ticker.add(this.update, this);
  }

  stop() {
    Ticker.remove(this.update, this);
  }

  update() {}
}
