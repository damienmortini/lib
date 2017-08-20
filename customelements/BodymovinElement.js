import bodymovin from "bodymovin";

(() => {
  let style = document.createElement("style");
  style.textContent = `
    dlib-bodymovin {
      display: block;
    }
  `;
  document.head.appendChild(style);
})();

export default class BodymovinElement extends HTMLElement {
  constructor() {
    super();
    this.renderer = "svg";
    this.loop = this.hasAttribute("loop");
    this.autoplay = this.hasAttribute("autoplay");
    this.playbackRate = 1;

    this.src = this.getAttribute("src");
  }

  get src() {
    return this._src;
  }

  set src(value) {
    this._src = value;
    if(this.animation) {
      this.animation.destroy();
    }
    this.animation = bodymovin.loadAnimation({
      container: this,
      renderer: this.renderer,
      autoplay: this.autoplay,
      path: this._src
    });
    this.animation.addEventListener("DOMLoaded", () => {
      if(this._segments) {
        this.segments = this._segments;
      }
      this.loop = this._loop;
      this.playbackRate = this._playbackRate;
      this.playbackRate = this._playbackRate;
    });
    this.animation.addEventListener("loopComplete", () => {
      this.dispatchEvent(new Event("ended"));
    });
    this.animation.addEventListener("complete", () => {
      this.dispatchEvent(new Event("ended"));
    });
  }

  play() {
    this.animation.play();
  }

  pause() {
    this.animation.pause();
  }

  set loop(value) {
    this._loop = value;
    if(this.animation) {
      this.animation.loop = value;
    }
  }

  get loop() {
    return this._loop;
  }

  get paused() {
    return this.animation.isPaused;
  }

  set currentTime(value) {
    this._currentTime = value;
    if(this.paused) {
      this.animation.goToAndStop(this._currentTime, false);
    } else {
      this.animation.goToAndPlay(this._currentTime, false);
    }
  }

  get currentTime() {
    return this._currentTime;
  }

  set frameRate(value) {
    this._frameRate = value;
    if(this.animation) {
      this.animation.frameRate = value;
    }
  }

  get frameRate() {
    return this._frameRate;
  }

  set playbackRate(value) {
    this._playbackRate = value;
    if(this.animation) {
      this.animation.setSpeed(Math.abs(value));
      this.animation.setDirection(value);
    }
  }

  get playbackRate() {
    return this._playbackRate;
  }

  set segments(value) {
    this._segments = value;
    if(this.animation) {
      this.animation.playSegments(this._segments, true);
    }
  }

  get segments() {
    return this._segments;
  }
}

window.customElements.define("dlib-bodymovin", BodymovinElement);
