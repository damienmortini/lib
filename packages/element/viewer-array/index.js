import GestureObserver from '../core/input/GestureObserver.js';

export default class ArrayViewerElement extends HTMLElement {
  static get observedAttributes() {
    return ['array', 'min', 'max', 'zoom', 'controls'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          width: 300px;
          height: 150px;
          background: lightgrey;
        }
        :host([controls]) {
          touch-action: none;
        }
        canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
      </style>
      <canvas></canvas>
    `;

    this.canvas = this.shadowRoot.querySelector('canvas');
    this.context = this.canvas.getContext('2d');

    this._zoom = 1;
    this._scrollLeft = 0;
    this._width = 1;
    this._array = [];

    const resizeObserver = new ResizeObserver((entries) => {
      this._width = entries[0].contentRect.width;
      this.canvas.width = entries[0].contentRect.width * devicePixelRatio;
      this.canvas.height = entries[0].contentRect.height * devicePixelRatio;
      this.draw();
    });
    resizeObserver.observe(this);

    this.addEventListener('wheel', (event) => {
      if (this.controls) {
        event.preventDefault();
        if (event.deltaY > 0) {
          this.zoom *= .95;
        } else {
          this.zoom /= .95;
        }
        // const newValue = Math.max(1, value);
        // const difference = newValue - this._zoom;
        // const widthDifference = (this._width * newValue) - this.scrollWidth;
        // const previousScrollWidth = this.scrollWidth;
        // console.log(this.scrollLeft + this._width, this.scrollWidth);

        // let ratio = this.scrollLeft / this.scrollWidth;
        // // ratio *= 1 + difference;
        // console.log(ratio);

        // this.scrollLeft = this.scrollWidth * ratio;
        // // this.scrollLeft += widthDifference * .5;
      }
    });

    this._gestureObserver = new GestureObserver((gesture) => {
      this.scrollLeft -= gesture.movementX;
    }, { pointerLock: true });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'array':
        this.array = new Function(`return ${newValue}`)();
        break;
      case 'controls':
        this._gestureObserver[newValue !== null ? 'observe' : 'unobserve'](this);
        break;
      case 'max':
      case 'min':
      case 'zoom':
        this[name] = Number(newValue);
        break;
    }
  }

  connectedCallback() {
    this.draw();
  }

  draw({
    start = 0,
    length = this.array.length,
    offset = 0,
  } = {}) {
    if (offset) {
      this.context.globalCompositeOperation = 'copy';
      this.context.drawImage(this.canvas, offset, 0, this.canvas.width, this.canvas.height);
      this.context.globalCompositeOperation = 'source-over';
    }
    const x = this._getCanvasXFromIndex(start);
    const width = this._getCanvasXFromIndex(start + length) - x;
    this.context.clearRect(x, 0, width, this.canvas.height);
    const height = this.canvas.height / Math.round(this.max - this.min);
    const y = Math.round(this.canvas.height + this.min * height);
    for (let index = start; index < start + length; index++) {
      const x = this._getCanvasXFromIndex(index);
      const width = this._getCanvasXFromIndex(index + 1) - x;
      this.context.fillRect(x, y, width, Math.round(-this.array[index] * height));
    }
  }

  _getCanvasXFromIndex(index) {
    return Math.floor(index / this.array.length * this.zoom * this.canvas.width - this.scrollLeft * window.devicePixelRatio);
  }

  _updateBounds() {
    if (!this.array.length) {
      return;
    }
    if (this._min === undefined) {
      this._minValue = 0;
      for (const value of this.array) {
        this._minValue = Math.min(this._minValue, value);
      }
    }
    if (this._max === undefined) {
      this._maxValue = this._minValue;
      for (const value of this.array) {
        this._maxValue = Math.max(this._maxValue, value);
      }
    }
    if (this._maxValue === this._minValue) {
      this._minValue = Math.min(this._minValue, 0);
      this._maxValue = Math.max(this._maxValue, 100);
    }
  }

  get array() {
    return this._array;
  }

  set array(value) {
    this._array = value;
    this._updateBounds();
    this.draw();
  }

  get controls() {
    return this.hasAttribute('controls');
  }

  set controls(value) {
    if (value) {
      this.setAttribute('controls', '');
    } else {
      this.removeAttribute('controls');
    }
  }

  get min() {
    return this._min !== undefined ? this._min : this._minValue;
  }

  set min(value) {
    this._min = value;
    this._updateBounds();
    this.draw();
  }

  get max() {
    return this._max !== undefined ? this._max : this._maxValue;
  }

  set max(value) {
    this._max = value;
    this._updateBounds();
    this.draw();
  }

  get zoom() {
    return this._zoom;
  }

  set zoom(value) {
    this._zoom = Math.max(1, value);
    this.draw();
  }

  get scrollWidth() {
    return this._width * this.zoom;
  }

  get scrollLeft() {
    return this._scrollLeft;
  }

  set scrollLeft(value) {
    value = Math.max(0, Math.min(this.scrollWidth - this._width, value));
    if (value === this._scrollLeft) {
      return;
    }
    const offset = Math.floor(this._scrollLeft * devicePixelRatio - value * devicePixelRatio);
    this._scrollLeft = value;

    const cellWidth = (1 / this.array.length) * this.zoom * this.canvas.width;
    const start = Math.floor(((offset < 0 ? this.canvas.width + offset : 0) + this.scrollLeft * devicePixelRatio) / cellWidth);
    const length = Math.ceil(Math.abs(offset) / cellWidth);
    this.draw({ start, length: offset > 0 ? length + 1 : length, offset });
  }
}

if (!customElements.get('damo-viewer-array')) {
  customElements.define('damo-viewer-array', class extends ArrayViewerElement { });
}
