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
    });
    this.animation.addEventListener("loopComplete", () => {
      this.dispatchEvent(new Event("ended"));
    });
  }

  set segments(value) {
    this._segments = value;
    this.animation.playSegments(this._segments, true);
  }

  get segments() {
    return this._segments;
  }
}

window.customElements.define("dlib-bodymovin", BodymovinElement);
