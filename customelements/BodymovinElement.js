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
    this.loop = false;
    this.direction = 1;
    this.speed = 1;
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
      path: this._src
    });
    this.animation.addEventListener("DOMLoaded", () => {
      if(this._segments) {
        this.segments = this._segments;
      }
      this.loop = this._loop;
      this.direction = this._direction;
      this.speed = this._speed;
    });
    this.animation.addEventListener("loopComplete", () => {
      this.dispatchEvent(new Event("ended"));
    });
    this.animation.addEventListener("complete", () => {
      this.dispatchEvent(new Event("ended"));
    });
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

  set direction(value) {
    this._direction = value;
    if(this.animation) {
      this.animation.setDirection(value);
    }
  }

  get direction() {
    return this._direction;
  }

  set speed(value) {
    this._speed = value;
    if(this.animation) {
      this.animation.setSpeed(value);
      this.animation.play();
    }
  }

  get speed() {
    return this._speed;
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
