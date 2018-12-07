import LoopElement from "./LoopElement.js";
import Pointer from "../input/Pointer.js";
import Vector2 from "../math/Vector2.js";

export default class JoystickInputElement extends LoopElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" }).innerHTML = `
      <style>
        :host {
          -webkit-tap-highlight-color: transparent;
          display: inline-block;
          position: relative;
          width: 100px;
          height: 100px;
          cursor: pointer;
        }
        .outer-ring, .joystick {
          border-radius: 50%;
          box-sizing: border-box;
        }
        .outer-ring {
          border: 1px solid;
          width: 100%;
          height: 100%;
        }
        .joystick {
          background: currentColor;
          position: absolute;
          top: 50%;
          left: 50%;
          width: 50%;
          height: 50%;
          margin-top: -25%;
          margin-left: -25%;
          pointer-events: none;
        }
      </style>
      <div class="outer-ring"></div>
      <div class="joystick"></div>
    `;

    this._position = new Vector2();
    this._lerpedPosition = new Vector2();
    this._firstTouchOrigin = new Vector2();

    this._pointer = new Pointer(this);
    this._windowPointer = new Pointer();

    this._windowPointer.onDown.add(() => {
      if (!this._pointer.downed) {
        return;
      }

      this._firstTouchOrigin.copy(this._windowPointer).subtract(this._pointer.centered);
      this.play();

      this._windowPointer.onUp.add(() => {
        this.dispatchEvent(new CustomEvent("input", {
          detail: [0, 0],
        }));
        this.dispatchEvent(new CustomEvent("change", {
          detail: [...this._position],
        }));
      }, { once: true });
    });

    this._joystick = this.shadowRoot.querySelector(".joystick");
  }

  get value() {
    return this._position;
  }

  update() {
    if (this._pointer.downed) {
      this._position.copy(this._windowPointer).subtract(this._firstTouchOrigin).scale(1 / this._pointer._domElementBoundingRect.width * 2);

      if (this._position.size > 1) {
        this._position.normalize();
      }
    } else {
      this._position.set(0, 0);
    }

    this._lerpedPosition.x += (this._position.x - this._lerpedPosition.x) * (this._pointer.downed ? .5 : .1);
    this._lerpedPosition.y += (this._position.y - this._lerpedPosition.y) * (this._pointer.downed ? .5 : .1);

    if (this._lerpedPosition.size < .001) {
      this._lerpedPosition.set(0, 0);
      this.pause();
    }

    this._joystick.style.transform = `translate(${this._lerpedPosition.x * this._pointer._domElementBoundingRect.width * .5}px, ${this._lerpedPosition.y * this._pointer._domElementBoundingRect.height * .5}px)`;

    if (this._pointer.downed) {
      this.dispatchEvent(new CustomEvent("input", {
        detail: [...this._position],
      }));
    }
  }
}

window.customElements.define("dlib-input-joystick", JoystickInputElement);
