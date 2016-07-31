import Ticker from "../utils/Ticker.js";

import CustomElement from "./CustomElement.js";

export default class LoopElement extends CustomElement {
  createdCallback({autoplay = true} = {}) {
    super.createdCallback();
    this._autoplay = autoplay;
  }

  attachedCallback() {
    window.addEventListener("blur", this._pauseBinded = this.pause.bind(this));
    window.addEventListener("focus", this._playBinded = this.play.bind(this));
    if(this._autoplay) {
      this.play();
    }
  }

  detachedCallback() {
    this.pause();
    window.removeEventListener("blur", this._pauseBinded);
    window.removeEventListener("focus", this._playBinded);
  }

  play() {
    this.pause();
    this._tickerID = Ticker.add(this.update.bind(this));
  }

  pause() {
    Ticker.remove(this._tickerID);
  }

  update() {}
}
