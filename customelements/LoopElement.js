import "@webcomponents/custom-elements";

import Ticker from "../utils/Ticker.js";

export default class LoopElement extends HTMLElement {
  constructor({autoplay = true, background = false} = {}) {
    super();
    this._autoplay = autoplay;
    this._background = background;
  }

  connectedCallback() {
    if(!this._background) {
      window.addEventListener("blur", this._pauseBinded = this.pause.bind(this));
      window.addEventListener("focus", this._playBinded = this.play.bind(this));
    }
    if(this._autoplay) {
      this.play();
    }
  }

  disconnectedCallback() {
    this.pause();
    window.removeEventListener("blur", this._pauseBinded);
    window.removeEventListener("focus", this._playBinded);
  }

  play() {
    Ticker.add(this._updateBinded = this._updateBinded || this.update.bind(this));
  }

  pause() {
    Ticker.delete(this._updateBinded);
  }

  update() {}
}

window.customElements.define("dlib-loop", LoopElement);
