import Ticker from "../../dlib/util/Ticker.js";

export default class TickerElement extends HTMLElement {
  constructor({ autoplay = false, background = false } = {}) {
    super();

    this._autoplay = autoplay || this.hasAttribute("autoplay");
    this._background = background || this.hasAttribute("background");

    this._paused = true;
    this._pausedByUser = true;
    this._pausedByBlur = false;

    this._updateBinded = this.update.bind(this);
    this._onFocusChangeBinded = this._onFocusChange.bind(this);
  }

  connectedCallback() {
    if (!this._background) {
      window.top.addEventListener("blur", this._onFocusChangeBinded);
      window.top.addEventListener("focus", this._onFocusChangeBinded);
      document.addEventListener("visibilitychange", this._onFocusChangeBinded);
    }
    if (this._autoplay) {
      if (!window.top.document.hasFocus() && !this._background) {
        this._pausedByBlur = true;
        requestAnimationFrame(this._updateBinded);
      }
      this.play();
    }
  }

  disconnectedCallback() {
    this._pausedByBlur = true;
    window.top.removeEventListener("blur", this._onFocusChangeBinded);
    window.top.removeEventListener("focus", this._onFocusChangeBinded);
    document.removeEventListener("visibilitychange", this._onFocusChangeBinded);
  }

  get paused() {
    return this._paused;
  }

  get _pausedByUser() {
    return this.__pausedByUser;
  }

  set _pausedByUser(value) {
    this.__pausedByUser = value;
    this._updatePlaybackState();
  }

  get _pausedByBlur() {
    return this.__pausedByBlur;
  }

  set _pausedByBlur(value) {
    this.__pausedByBlur = value;
    this._updatePlaybackState();
  }

  _onFocusChange(event) {
    switch (event.type) {
      case "visibilitychange":
        if (document.visibilityState !== "visible") {
          this._pausedByBlur = true;
        }
        break;
      case "blur":
        this._pausedByBlur = true;
        break;
      case "focus":
        this._pausedByBlur = false;
        break;
    }
  }

  _updatePlaybackState() {
    const paused = this._pausedByUser || this._pausedByBlur;

    if (paused === this._paused) {
      return;
    }

    this._paused = paused;

    if (this._paused) {
      Ticker.delete(this._updateBinded);
      this.dispatchEvent(new Event("pause"));
    } else {
      Ticker.add(this._updateBinded);
      this.dispatchEvent(new Event("playing"));
    }
  }

  play() {
    this._pausedByUser = false;
  }

  pause() {
    this._pausedByUser = true;
  }

  update() { }
}