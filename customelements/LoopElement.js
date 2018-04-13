import Ticker from "../utils/Ticker.js";

export default class LoopElement extends HTMLElement {
  constructor({autoplay = false, background = false} = {}) {
    super();
    this._autoplay = autoplay || this.hasAttribute("autoplay");
    this._background = background || this.hasAttribute("background");

    this.paused = true;
    this._pausedByBlur = false;

    this._updateBinded = this.update.bind(this);
  }

  connectedCallback() {
    if(!this._background) {
      window.top.addEventListener("blur", this._onBlur = () => {
        this._pausedByBlur = !this.paused;
        this.pause();
      });
      window.top.addEventListener("focus", this._onFocus = () => {
        if(this._pausedByBlur) {
          this.play();
        }
      });
    }
    if((window.top.document.hasFocus() || this._background) && this._autoplay) {
      this.play();
    } else if (this._autoplay) {
      this._pausedByBlur = true;
      requestAnimationFrame(this._updateBinded);
    }
  }

  disconnectedCallback() {
    this.pause();
    window.top.removeEventListener("blur", this._onBlur);
    window.top.removeEventListener("focus", this._onFocus);
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
