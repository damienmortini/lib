import '../element-viewer-array/index.js';
import Ticker from '../core/util/Ticker.js';

export default class ArraySignalInputElement extends HTMLElement {
  static get observedAttributes() {
    return ['array', 'position', 'length', 'min', 'max', 'step', 'zoom'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          height: 150px;
          width: 300px;
          background: lightgrey;
          touch-action: none;
        }
        damo-viewer-array {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
      </style>
      <damo-viewer-array></damo-viewer-array>
    `;

    this._viewer = this.shadowRoot.querySelector('damo-viewer-array');

    this._position = 0;
    this._scrollLeft = 0;
    this._previousValue = undefined;

    this.length = 1;
    this.array = new Float32Array(100);

    const resizeObserver = new ResizeObserver((entries) => {
      this._width = entries[0].contentRect.width;
      this._height = entries[0].contentRect.height;
    });
    resizeObserver.observe(this);

    let previousPosition = null;
    let pointerOffsetX = 0;
    let pointerOffsetY = 0;

    this._snap = false;

    const keySet = new Set();
    window.addEventListener('keydown', (event) => {
      if (keySet.has(event.key)) {
        return;
      }
      keySet.add(event.key);
      switch (event.key) {
        case 'Shift':
          previousPosition = null;
          this._snap = true;
          break;
        case 'Control':
          this._viewer.controls = true;
          break;
      }
    });
    window.addEventListener('keyup', (event) => {
      switch (event.key) {
        case 'Shift':
          previousPosition = null;
          this._snap = false;
          break;
        case 'Control':
          this._viewer.controls = false;
          break;
      }
      keySet.delete(event.key);
    });

    const setValuesFromPosition = () => {
      let value = (1 - pointerOffsetY / this._height) * (this.max - this.min) + (this.min || 0);
      value = Math.round(value / this.step) * this.step;
      value = Math.max(Math.min(this.max, value), this.min);
      const newPosition = this._snap ? this.position : ((pointerOffsetX + this.scrollLeft) / this.scrollWidth) * this.length;
      previousPosition = previousPosition !== null ? previousPosition : newPosition;
      const startPosition = newPosition > previousPosition ? previousPosition : newPosition;
      const endPosition = newPosition > previousPosition ? newPosition : previousPosition;
      const startIndex = Math.max(0, Math.floor((startPosition / this.length) * this.array.length));
      const endIndex = Math.min(this.array.length, Math.ceil((endPosition / this.length) * this.array.length));
      for (let index = startIndex; index < endIndex; index++) {
        this.array[index] = value;
      }
      this._viewer.draw({
        start: startIndex,
        length: endIndex - startIndex,
      });
      previousPosition = newPosition;
      this.dispatchEvent(new Event('input', {
        bubbles: true,
      }));
      if (this._snap) {
        this.value = value;
      }
    };
    const pointerDown = (event) => {
      if (this._viewer.controls || !(event.buttons & 1)) {
        return;
      }
      this._viewer.setPointerCapture(event.pointerId);
      this._viewer.addEventListener('pointermove', pointerMove);
      this._viewer.addEventListener('pointerup', pointerUp);
      this._viewer.addEventListener('pointerout', pointerUp);
      pointerMove(event);
      Ticker.add(setValuesFromPosition);
    };
    const pointerMove = (event) => {
      pointerOffsetX = event.offsetX;
      pointerOffsetY = event.offsetY;
    };
    const pointerUp = (event) => {
      Ticker.delete(setValuesFromPosition);
      previousPosition = null;
      this._viewer.releasePointerCapture(event.pointerId);
      this._viewer.removeEventListener('pointermove', pointerMove);
      this._viewer.removeEventListener('pointerup', pointerUp);
      this._viewer.removeEventListener('pointerout', pointerUp);
    };
    this._viewer.addEventListener('pointerdown', pointerDown);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'array':
        this.array = new Function(`return ${newValue}`)();
        break;
      case 'position':
        this.position = Number(newValue);
        break;
      case 'min':
      case 'max':
      case 'step':
      case 'zoom':
        this[name] = Number(newValue);
        break;
    }
  }

  draw() {
    this._viewer.draw();
    this._viewer.context.strokeStyle = 'red';
    const position = this.position / this.length * this.zoom * this._viewer.canvas.width;
    this._viewer.context.beginPath();
    this._viewer.context.moveTo(position, 0);
    this._viewer.context.lineTo(position, this._viewer.canvas.height);
    this._viewer.context.stroke();
  }

  get position() {
    return this._position;
  }

  set position(value) {
    if (this._position === value) {
      return;
    }
    this._position = value;
    if (this.value !== this._previousValue && !this._snap) {
      this.dispatchEvent(new Event('change', {
        bubbles: true,
      }));
      this._previousValue = this.value;
    }
    this.draw();
  }

  get array() {
    return this._viewer.array;
  }

  set array(value) {
    this._array = this._viewer.array = value;
  }

  get value() {
    return this.array[Math.floor((this.position / this.length) * (this.array.length - 1))];
  }

  set value(value) {
    const index = Math.floor((this.position / this.length) * (this.array.length - 1));
    this.array[index] = value;
    this._viewer.draw({
      start: index,
      length: 1,
    });
    if (this.value !== this._previousValue) {
      this.dispatchEvent(new Event('change', {
        bubbles: true,
      }));
      this._previousValue = this.value;
    }
  }

  get min() {
    return this._viewer.min;
  }

  set min(value) {
    this._viewer.min = value;
  }

  get max() {
    return this._viewer.max;
  }

  set max(value) {
    this._viewer.max = value;
  }

  get step() {
    return this._viewer.step;
  }

  set step(value) {
    this._viewer.step = value;
  }

  get name() {
    return this.getAttribute('name');
  }

  set name(value) {
    this.setAttribute('name', value);
  }

  get scrollLeft() {
    return this._viewer.scrollLeft;
  }

  set scrollLeft(value) {
    this._viewer.scrollLeft = value;
  }

  get zoom() {
    return this._viewer.zoom;
  }

  set zoom(value) {
    this._viewer.zoom = value;
  }

  get scrollWidth() {
    return this._viewer.scrollWidth;
  }
}

if (!customElements.get('damo-input-signal-array')) {
  customElements.define('damo-input-signal-array', class DamoArraySignalInputElement extends ArraySignalInputElement { });
}
