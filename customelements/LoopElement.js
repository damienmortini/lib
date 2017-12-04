import Ticker from "../utils/Ticker.js";

export default class LoopElement extends HTMLElement {
  constructor({autoplay = true, background = false} = {}) {
    super();
    this._autoplay = autoplay || this.hasAttribute("autoplay");
    this._background = background || this.hasAttribute("background");

    this.paused = true;
    this._pausedByBlur = true;

    this._updateBinded = this.update.bind(this);
  }

  connectedCallback() {
    if(!this._background) {
      window.addEventListener("blur", this._onBlur = () => {
        this._pausedByBlur = !this.paused;
        this.pause();
      });
      window.addEventListener("focus", this._onFocus = () => {
        if(this._pausedByBlur) {
          this.play();
        }
      });
    }
    if(document.hasFocus() && this._autoplay) {
      this.play();
    } else {
      this._pausedByBlur = this._autoplay;
    }
  }

  disconnectedCallback() {
    this.pause();
    window.removeEventListener("blur", this._onBlur);
    window.removeEventListener("focus", this._onFocus);
  }

  play() {
    this.paused = false;
    this._pausedByBlur = false;
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
