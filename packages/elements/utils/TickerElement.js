import Ticker from "../../dlib/utils/Ticker.js";

export default class TickerElement extends HTMLElement {
  constructor({ autoplay = false, background = false } = {}) {
    super();

    this._autoplay = autoplay || this.hasAttribute("autoplay");
    this._background = background || this.hasAttribute("background");

    this._paused = true;
    this.__pausedByBlur = false;

    this._updateBinded = this.update.bind(this);
  }

  connectedCallback() {
    if (!this._background) {
      window.top.addEventListener("blur", this._onBlur = () => {
        this._pausedByBlur = true;
      });
      window.top.addEventListener("focus", this._onFocus = () => {
        this._pausedByBlur = false;
      });
    }
    if (this._autoplay) {
      this.play();
      if (!window.top.document.hasFocus() && !this._background) {
        this._pausedByBlur = true;
        requestAnimationFrame(this._updateBinded);
      }
    }
  }

  disconnectedCallback() {
    this.pause();
    window.top.removeEventListener("blur", this._onBlur);
    window.top.removeEventListener("focus", this._onFocus);
  }

  get _pausedByBlur() {
    return this.__pausedByBlur;
  }

  set _pausedByBlur(value) {
    if (value === this.__pausedByBlur) {
      return;
    }
    this.__pausedByBlur = value;
    if (this.__pausedByBlur) {
      Ticker.delete(this._updateBinded);
    } else {
      if (!this.paused) {
        Ticker.add(this._updateBinded);
      }
    }
  }

  get paused() {
    return this._paused;
  }

  set paused(value) {
    if (value === this._paused) {
      return;
    }
    this._paused = value;
    if (this._paused) {
      Ticker.delete(this._updateBinded);
      this.dispatchEvent(new Event("pause"));
    } else {
      if (!this._pausedByBlur) {
        Ticker.add(this._updateBinded);
      }
      this.dispatchEvent(new Event("playing"));
    }
  }

  play() {
    this.paused = false;
  }

  pause() {
    this.paused = true;
  }

  update() { }
}
