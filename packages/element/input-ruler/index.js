import Ticker from '../core/util/Ticker.js';

const SIDE_MOVEMENT_SPEED = .02;
const PADDING_RATIO = .1;

export default class RulerInputElement extends HTMLElement {
  static get observedAttributes() {
    return ['step', 'min', 'max', 'zoom', 'noscroll'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          width: 300px;
          height: 30px;
          font-family: monospace;
          touch-action: none;
          user-select: none;
          contain: layout;
        }
        #tick {
          contain: layout;
          position: absolute;
          pointer-events: none;
          will-change: transform;
          left: 0;
          top: 4px;
          left: 0;
          padding: 2px 5px;
          background: white;
          border-radius: 2px;
          box-shadow: 0 0 4px black;
        }
        #scroller {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow-x: overlay;
          touch-action: none;
        }
        #content {
          height: 100%;
          background-size: 10% 10%, 100% 100%;
          background-color: white;
          background-image: linear-gradient(to right, lightgrey 0px, transparent 1px), linear-gradient(to right, black 0px, transparent 1px);
        }
        #scroller::-webkit-scrollbar {
          background: transparent;
          height: 2px;
        }
        #scroller::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, .1);
        }
      </style>
      <div id="scroller"><div id="content"></div></div>
      <div id="tick">0.00</div>
    `;

    this._tick = this.shadowRoot.querySelector('#tick');
    this._scroller = this.shadowRoot.querySelector('#scroller');
    this._scrollerContent = this.shadowRoot.querySelector('#content');

    this._scroller.addEventListener('scroll', (event) => {
      this.dispatchEvent(new Event('scroll', event));
    });

    this._zoom = 1;
    this._step = 1;
    this._min = 0;
    this._max = 100;
    this._width = 1;
    this._scrollLeft = 0;
    this.value = 0;

    let pointerOffsetX = 0;
    const updateValueFromInput = () => {
      let positionRatio = (pointerOffsetX + this.scrollLeft) / this.scrollWidth;
      const padding = this._width * PADDING_RATIO;
      const right = this._width - padding;
      let speed = 0;
      // if (pointerOffsetX > right && (this.scrollLeft + this._width < this.scrollWidth)) {
      //   speed = (pointerOffsetX - right) / padding * SIDE_MOVEMENT_SPEED;
      // } else if (pointerOffsetX < padding && this.scrollLeft) {
      //   speed = (pointerOffsetX - padding) / padding * SIDE_MOVEMENT_SPEED;
      // }
      // this.scrollLeft += speed * this.scrollWidth;
      positionRatio += speed;
      const value = this.value;
      this.value = positionRatio * (this.max - this.min) + this.min;
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

    this._scroller.addEventListener('scroll', () => {
      this._scrollLeft = this._scroller.scrollLeft;
      this._update();
    });

    const resizeObserver = new ResizeObserver((entries) => {
      this._width = entries[0].contentRect.width;
      this._updateBackgroundSize();
      this._update();
    });
    resizeObserver.observe(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'noscroll':
        this._scroller.style.pointerEvents = newValue === null ? '' : 'none';
        break;
      default:
        this[name] = Number(newValue);
        break;
    }
  }

  _getLocalOffsetXFromValue() {
    const positionRatio = (this.value - this.min) / (this.max - this.min);
    const edgeX = positionRatio * this._width * this.zoom - this.scrollLeft;
    console.log(edgeX);
  }

  _updateBackgroundSize() {
    const ratio = this._step / (this.max - this.min) * this.zoom;
    this._scrollerContent.style.backgroundSize = `${ratio * this._width}px, ${10 * ratio * this._width}px`;
  }

  _update() {
    if (!this._width) {
      return;
    }
    const positionRatio = (this.value - this.min) / (this.max - this.min);
    const edgeX = positionRatio * this.scrollWidth - this.scrollLeft;

    const padding = this._width * PADDING_RATIO;
    const right = this._width - padding;
    // if (edgeX > right) {
    //   this.scrollLeft += (edgeX - right);
    // } else if (edgeX < padding) {
    //   this.scrollLeft += (edgeX - padding);
    // }
    let x = positionRatio * this.scrollWidth - this.scrollLeft;
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
    this._scrollerContent.style.width = `${this._zoom * 100}%`;
    this._updateBackgroundSize();
    this._update();
  }

  get scrollLeft() {
    return this._scrollLeft;
  }

  set scrollLeft(value) {
    this._scrollLeft = value;
    this._scroller.scrollLeft = value;
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
    this._updateBackgroundSize();
    this._tick.textContent = `${this._value.toFixed(this._decimals)}`;
    this.value = Math.round(this.value / this.step) * this.step;
  }
}

customElements.define('damo-input-ruler', RulerInputElement);
