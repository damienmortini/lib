import ArrayViewerElement from '../element-viewer-array/index.js';
import Ticker from '../core/util/Ticker.js';

export default class ArraySignalInputElement extends ArrayViewerElement {
  static get observedAttributes() {
    return [...ArrayViewerElement.observedAttributes, 'position', 'length'];
  }

  constructor() {
    super();

    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        :host {
          cursor: crosshair;
        }
        #head {
          position: absolute;
          will-change: transform;
          height: 100%;
          top: 0;
          left: 0;
          border-left: 1px solid red;
        }
      </style>
      <div id="head"></div>
    `;
    this.shadowRoot.append(template.content.cloneNode(true));

    this._length = 1;
    this._position = 0;
    this._previousValue = undefined;

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
          this.controls = true;
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
          this.controls = false;
          break;
      }
      keySet.delete(event.key);
    });

    const setValuesFromPosition = () => {
      let value = (1 - pointerOffsetY / this._height) * (this.max - this.min) + (this.min || 0);
      value = Math.max(Math.min(this.max, value), this.min);
      const newPosition = this._snap ? this.position : ((pointerOffsetX + this.scrollLeft) / this.scrollWidth) * this.length;
      previousPosition = previousPosition !== null ? previousPosition : newPosition;
      const startPosition = newPosition > previousPosition ? previousPosition : newPosition;
      const endPosition = newPosition > previousPosition ? newPosition : previousPosition;
      const startIndex = this._getIndexFromPosition(startPosition);
      const endIndex = this._getIndexFromPosition(endPosition);
      for (let index = startIndex; index <= endIndex; index++) {
        this.array[index] = value;
      }
      this.draw();
      previousPosition = newPosition;
      this.dispatchEvent(new Event('input', {
        bubbles: true,
      }));
      if (this._snap && value !== this._previousValue) {
        this.dispatchEvent(new Event('change', {
          bubbles: true,
        }));
        this._previousValue = value;
      }
    };
    const pointerDown = (event) => {
      if (this.controls || !(event.buttons & 1) || this.disabled) {
        return;
      }
      this.canvas.setPointerCapture(event.pointerId);
      this.canvas.addEventListener('pointermove', pointerMove);
      this.canvas.addEventListener('pointerup', pointerUp);
      this.canvas.addEventListener('pointerout', pointerUp);
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
      this.canvas.releasePointerCapture(event.pointerId);
      this.canvas.removeEventListener('pointermove', pointerMove);
      this.canvas.removeEventListener('pointerup', pointerUp);
      this.canvas.removeEventListener('pointerout', pointerUp);
    };
    this.canvas.addEventListener('pointerdown', pointerDown);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'position':
        this.position = Number(newValue);
        break;
      case 'length':
        this[name] = Number(newValue);
        break;
      default:
        super.attributeChangedCallback(name, oldValue, newValue);
    }
  }

  _getIndexFromPosition(position) {
    return Math.min(this.array.length - 1, Math.max(0, Math.floor(position / this.length * this.array.length)));
  }

  get position() {
    return this._position;
  }

  set position(value) {
    value = Math.min(this.length, Math.max(0, value));
    if (this._position === value) {
      return;
    }
    this._position = value;
    let x = this._position / this.length * this._width * this.zoom - this.scrollLeft;
    x = Math.min(this._width, Math.max(0, x));
    this._head.style.transform = `translateX(${x}px)`;
    const arrayValue = this.array[this._getIndexFromPosition(this.position)];
    if (arrayValue !== this._previousValue && !this._snap) {
      this.dispatchEvent(new Event('change', {
        bubbles: true,
      }));
      this._previousValue = arrayValue;
    }
  }

  get value() {
    return this.array[this._getIndexFromPosition(this.position)];
  }

  get length() {
    return this._length;
  }

  set length(value) {
    this._length = value;
    this.draw();
  }

  get name() {
    return this.getAttribute('name');
  }

  set name(value) {
    this.setAttribute('name', value);
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
}

if (!customElements.get('damo-input-signal-array')) {
  customElements.define('damo-input-signal-array', class DamoArraySignalInputElement extends ArraySignalInputElement { });
}
