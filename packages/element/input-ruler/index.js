import Ticker from '../core/util/Ticker.js';

const SIDE_MOVEMENT_SPEED = .2;
const PADDING_RATIO = .25;

export default class RulerInputElement extends HTMLElement {
  static get observedAttributes() {
    return ['step', 'min', 'max', 'zoom'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          width: 300px;
          height: 20px;
          background: grey;
          font-family: monospace;
          touch-action: none;
          background-size: 10% 10%, 50% 50%;
          background-image: linear-gradient(to right, grey -.5px, transparent .5px), linear-gradient(to right, black -.5px, transparent .5px);
        }
        #tick {
          position: absolute;
          will-change: transform;
          left: 0;
          height: 100%;
          user-select: none;
          top: 2px;
          left: 0;
          padding: 0 5px;
          background: white;
          border-radius: 2px;
          height: calc(100% - 4px);
          box-shadow: 0 0 4px black;
        }
      </style>
      <div id="tick">0.00</div>
    `;

    this._zoom = 1;
    this._step = 1;
    this._min = 0;
    this._max = 100;
    this._scrollLeft = 0;
    this._tick = this.shadowRoot.querySelector('#tick');
    this._width = 1;
    this.value = 0;

    let pointerOffsetX = 0;
    const updateValueFromInput = () => {
      let positionRatio = (pointerOffsetX + this.scrollLeft) / this.scrollWidth;
      const padding = this._width * PADDING_RATIO;
      const right = this._width - padding;
      let speed = 0;
      if (pointerOffsetX > right && (this.scrollLeft + this._width < this.scrollWidth)) {
        speed = (pointerOffsetX - right) / padding * .01;
      } else if (pointerOffsetX < padding && this.scrollLeft) {
        speed = (pointerOffsetX - padding) / padding * .01;
      }
      this.scrollLeft += speed * this.scrollWidth;
      positionRatio += speed;
      const value = this.value;
      this.value = positionRatio * (this.max - this.min) + this.min;
      let x = positionRatio * this._width * this.zoom - this.scrollLeft;
      x = Math.min(this._width, Math.max(0, x));
      this._tick.style.transform = `translateX(${x}px) translateX(-50%)`;
      if (value !== this.value) {
        this.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };
    const pointerDown = (event) => {
      if (!(event.buttons & 1)) {
        return;
      }
      this.setPointerCapture(event.pointerId);
      this.addEventListener('pointermove', pointerMove);
      this.addEventListener('pointerup', pointerUp);
      this.addEventListener('pointerout', pointerUp);
      pointerMove(event);
      Ticker.add(updateValueFromInput);
    };
    const pointerMove = (event) => {
      pointerOffsetX = event.offsetX;
    };
    const pointerUp = (event) => {
      Ticker.delete(updateValueFromInput);
      this.releasePointerCapture(event.pointerId);
      this.removeEventListener('pointermove', pointerMove);
      this.removeEventListener('pointerup', pointerUp);
      this.removeEventListener('pointerout', pointerUp);
    };
    this.addEventListener('pointerdown', pointerDown);

    const resizeObserver = new ResizeObserver((entries) => {
      this._width = entries[0].contentRect.width;
      this._update();
    });
    resizeObserver.observe(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this[name] = Number(newValue);
  }

  _update() {
    if (!this._width) {
      return;
    }
    const positionRatio = (this.value - this.min) / (this.max - this.min);
    // const edgeX = positionRatio * this._width * this.zoom - this.scrollLeft;
    // const padding = this._width * PADDING_RATIO;
    // const right = this._width - padding;
    // if (edgeX > right) {
    //   this.scrollLeft += (edgeX - right) * SIDE_MOVEMENT_SPEED;
    // } else if (edgeX < padding) {
    //   this.scrollLeft += (edgeX - padding) * SIDE_MOVEMENT_SPEED;
    // }
    let x = positionRatio * this._width * this.zoom - this.scrollLeft;
    x = Math.min(this._width, Math.max(0, x));
    this._tick.style.transform = `translateX(${x}px) translateX(-50%)`;
  }

  get value() {
    return this._value;
  }

  set value(value) {
    value = Math.round(value / this.step) * this.step;
    value = Math.min(Math.max(this.min, value), this.max);
    if (value === this._value) {
      return;
    }
    this._value = value;
    this._tick.textContent = `${this._value.toFixed(this._decimals)}`;
    this._update();
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  get zoom() {
    return this._zoom;
  }

  set zoom(value) {
    this._zoom = Math.max(value, 1);
  }

  get scrollLeft() {
    return this._scrollLeft;
  }

  set scrollLeft(value) {
    value = Math.min(Math.max(0, value), this._width * (this.zoom - 1));
    if (this._scrollLeft === value) {
      return;
    }
    this._scrollLeft = value;
    this.dispatchEvent(new Event('scroll'));
  }

  get scrollWidth() {
    return this._width * this.zoom;
  }

  get min() {
    return this._min;
  }

  set min(value) {
    value = Math.min(this.max, value);
    this._min = value;
    this.value = Math.max(this.min, this.value);
  }

  get max() {
    return this._max;
  }

  set max(value) {
    value = Math.max(this.min, value);
    this._max = value;
    this.value = Math.min(this.max, this.value);
  }

  get step() {
    return this._step;
  }

  set step(value) {
    this._step = value;
    this._decimals = this._step % 1 ? String(this.step).split('.')[1].length : 0;
    this._tick.textContent = `${this._value.toFixed(this._decimals)}`;
    this.value = Math.round(this.value / this.step) * this.step;
  }
}

customElements.define('damo-input-ruler', RulerInputElement);
