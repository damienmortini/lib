export default class ArrayViewerElement extends HTMLElement {
  static get observedAttributes() {
    return ['array', 'min', 'max'];
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
        }
        canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          image-rendering: pixelated;
        }
      </style>
      <canvas></canvas>
    `;

    this._canvas = this.shadowRoot.querySelector('canvas');
    this._context = this._canvas.getContext('2d');

    this._array = [];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'array':
        this.array = new Function(`return ${newValue}`)();
        break;
      case 'max':
      case 'min':
        this[name] = Number(newValue);
        break;
    }
  }

  connectedCallback() {
    this.draw();
  }

  drawCallback(context, x, y, width, height, previousValue, value) {
    context.fillRect(x, y, width, height);
  }

  draw({
    start = 0,
    length = Infinity,
  } = {}) {
    this._context.clearRect(start, 0, length, this._canvas.height);
    let previousValue = undefined;
    const y = this._canvas.height + (this.min !== undefined ? this.min : this._minValue);
    length = Math.min(length, this.array.length - start);
    for (let index = start; index < start + length; index++) {
      const value = this.array[index];
      this.drawCallback(this._context, index, y, 1, -value, previousValue, value);
      previousValue = value;
    }
  }

  _updateHeight() {
    if (!this.array.length) {
      return;
    }
    if (this._min === undefined) {
      this._minValue = Infinity;
      for (const value of this.array) {
        this._minValue = Math.min(this._minValue, value);
      }
    }
    if (this._max === undefined) {
      this._maxValue = -Infinity;
      for (const value of this.array) {
        this._maxValue = Math.max(this._maxValue, value);
      }
    }
    if (this.height === undefined) {
      this._canvas.height = this.max - this.min;
    }
  }

  get array() {
    return this._array;
  }

  set array(value) {
    this._array = value;
    if (this.width === undefined) {
      this._canvas.width = this._array.length;
    }
    this._updateHeight();
    this.draw();
  }

  get width() {
    return this._width;
  }

  set width(value) {
    this._width = value;
    this._canvas.width = this._width;
    this.draw();
  }

  get height() {
    return this._height;
  }

  set height(value) {
    this._height = value;
    this._canvas.height = this._height;
    this.draw();
  }

  get min() {
    return this._min || this._minValue;
  }

  set min(value) {
    this._min = value;
    this._updateHeight();
    this.draw();
  }

  get max() {
    return this._max || this._maxValue;
  }

  set max(value) {
    this._max = value;
    this._updateHeight();
    this.draw();
  }
}

if (!customElements.get('damo-viewer-array')) {
  customElements.define('damo-viewer-array', class extends ArrayViewerElement { });
}
