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

    // const resizeObserver = new ResizeObserver((entries) => {
    //   this._canvas.width = entries[0].contentRect.width * devicePixelRatio;
    //   this._canvas.height = entries[0].contentRect.height * devicePixelRatio;
    //   this.draw();
    // });
    // resizeObserver.observe(this);
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

  draw() {
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    let previousValue = undefined;
    const y = this._canvas.height + (this.min !== undefined ? this.min : this._arrayMin);
    for (let index = 0; index < this.array.length; index++) {
      const value = this.array[index];
      this.drawCallback(this._context, index, y, 1, -value, previousValue, value);
      previousValue = value;
    }
  }

  _updateHeight() {
    if (!this.array.length) {
      return;
    }
    let min = this.min;
    if (this.min === undefined) {
      this._arrayMin = Infinity;
      for (const value of this.array) {
        this._arrayMin = Math.min(this._arrayMin, value);
      }
      min = this._arrayMin;
    }
    let max = this.max;
    if (this.max === undefined) {
      this._arrayMax = -Infinity;
      for (const value of this.array) {
        this._arrayMax = Math.max(this._arrayMax, value);
      }
      max = this._arrayMax;
    }
    this._canvas.height = max - min;
  }

  get array() {
    return this._array;
  }

  set array(value) {
    this._array = value;
    this._canvas.width = this._array.length;
    this._updateHeight();
    this.draw();
  }

  get min() {
    return this._min;
  }

  set min(value) {
    this._min = value;
    this._updateHeight();
    this.draw();
  }

  get max() {
    return this._max;
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
