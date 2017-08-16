import Ticker from "../utils/Ticker.js";

export default class LoopElement extends HTMLElement {
  constructor({autoplay = true, background = false} = {}) {
    super();
    this._autoplay = autoplay || this.hasAttribute("autoplay");
    this._background = background || this.hasAttribute("background");

    this.paused = true;

    this._updateBinded = this.update.bind(this);
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
    this.paused = false;
    Ticker.add(this._updateBinded);
    this.dispatchEvent(new Event("playing"));
  }

  pause() {
    this.paused = true;
    Ticker.delete(this._updateBinded);
    this.dispatchEvent(new Event("pause"));
  }

  update() {}
}

window.customElements.define("dlib-loop", LoopElement);
