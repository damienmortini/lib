import Vector2 from '../lib/math/Vector2.js';

export default class InputJoystickElement extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          -webkit-tap-highlight-color: transparent;
          display: inline-block;
          position: relative;
          width: 100px;
          height: 100px;
          cursor: pointer;
          touch-action: none;
        }

        :host([disabled]) {
          pointer-events: none;
          opacity: .5;
        }

        .outer-ring, .joystick {
          pointer-events: none;
          border-radius: 50%;
          box-sizing: border-box;
        }
        .outer-ring {
          border: 1px solid;
          width: 100%;
          height: 100%;
        }
        .joystick {
          will-change: transform;
          background: currentColor;
          position: absolute;
          top: 50%;
          left: 50%;
          width: 50%;
          height: 50%;
          margin-top: -25%;
          margin-left: -25%;
        }
      </style>
      <div class="outer-ring"></div>
      <div class="joystick"></div>
    `;

    this._joystick = this.shadowRoot.querySelector('.joystick');

    this._animationFrameID = -1;
    this._position = new Vector2();
    this._lerpedPosition = new Vector2();
    this._origin = new Vector2();

    this._onPointerMoveBinded = this._onPointerMove.bind(this);
    this._onPointerUpBinded = this._onPointerUp.bind(this);
    this._updateBinded = this._update.bind(this);

    this.addEventListener('pointerdown', (event) => {
      this._boundingClientRect = this.getBoundingClientRect();
      window.addEventListener('pointermove', this._onPointerMoveBinded, { passive: false });
      window.addEventListener('pointerup', this._onPointerUpBinded);
      this._pointerDowned = true;
      this._onPointerMove(event);
      this._update();
    });
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(value) {
    if (value) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  _onPointerMove(event) {
    this._position.x = (event.clientX - this._boundingClientRect.left) / this._boundingClientRect.width * 2 - 1;
    this._position.y = (event.clientY - this._boundingClientRect.top) / this._boundingClientRect.height * 2 - 1;
    if (this._position.size > 1) {
      this._position.normalize();
    }
  }

  _onPointerUp() {
    this._pointerDowned = false;
    window.removeEventListener('pointermove', this._onPointerMoveBinded);
    window.removeEventListener('pointerup', this._onPointerUpBinded);
    this.dispatchEvent(new CustomEvent('input', {
      detail: [0, 0],
    }));
    this.dispatchEvent(new CustomEvent('change', {
      detail: [...this._position],
    }));
  }

  get value() {
    return this._position;
  }

  _update() {
    this._animationFrameID = requestAnimationFrame(this._updateBinded);

    if (!this._pointerDowned) {
      this._position.set(0, 0);
    }

    this._lerpedPosition.x += (this._position.x - this._lerpedPosition.x) * (this._pointerDowned ? .5 : .1);
    this._lerpedPosition.y += (this._position.y - this._lerpedPosition.y) * (this._pointerDowned ? .5 : .1);

    if (!this._pointerDowned) {
      if (this._lerpedPosition.size < .001) {
        this._lerpedPosition.set(0, 0);
        cancelAnimationFrame(this._animationFrameID);
      }
    }

    this._joystick.style.transform = `translate(${this._lerpedPosition.x * this._boundingClientRect.width * .5}px, ${this._lerpedPosition.y * this._boundingClientRect.height * .5}px)`;

    if (this._pointerDowned) {
      this.dispatchEvent(new CustomEvent('input', {
        detail: [...this._position],
      }));
    }
  }
}
