import '../element-viewer-array/index.js';
import Ticker from '../core/util/Ticker.js';

export default class ArraySignalInputElement extends HTMLElement {
  static get observedAttributes() {
    return ['array', 'time', 'frequency', 'duration', 'min', 'max', 'step', 'zoom'];
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

    this._currentTime = 0;
    this._duration = 10;
    this._frequency = 10;
    this._scrollLeft = 0;
    this._previousValue = undefined;

    const resizeObserver = new ResizeObserver((entries) => {
      this._width = entries[0].contentRect.width;
      this._height = entries[0].contentRect.height;
    });
    resizeObserver.observe(this);

    let previousTime = null;
    let previousScrollLeft = 0;
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
          previousTime = null;
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
          previousTime = null;
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
      value = Math.max(Math.min(this.max, value), this.min);
      const newTime = this._snap ? this.currentTime : ((pointerOffsetX + this.scrollLeft - previousScrollLeft) / this._width) * this.duration;
      previousTime = previousTime !== null ? previousTime : newTime;
      const startTime = newTime > previousTime ? previousTime : newTime;
      const endTime = newTime > previousTime ? newTime : previousTime;
      const startIndex = Math.max(0, Math.floor((startTime / this.duration) * this.array.length * this.zoom));
      const endIndex = Math.min(this.array.length, Math.ceil((endTime / this.duration) * this.array.length * this.zoom));
      for (let index = startIndex; index < endIndex; index++) {
        this.array[index] = value;
      }
      this._viewer.draw({
        start: startIndex,
        length: endIndex - startIndex,
      });
      previousTime = newTime;
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
      previousScrollLeft = this.scrollLeft;
      pointerOffsetX = event.offsetX;
      pointerOffsetY = event.offsetY;
    };
    const pointerUp = (event) => {
      Ticker.delete(setValuesFromPosition);
      previousTime = null;
      this._viewer.releasePointerCapture(event.pointerId);
      this._viewer.removeEventListener('pointermove', pointerMove);
      this._viewer.removeEventListener('pointerup', pointerUp);
      this._viewer.removeEventListener('pointerout', pointerUp);
    };
    this._viewer.addEventListener('pointerdown', pointerDown);

    this._updateViewerWidth();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'array':
        this.array = new Function(`return [${newValue}]`)();
        break;
      case 'time':
        this.currentTime = Number(newValue);
        break;
      case 'frequency':
      case 'duration':
      case 'min':
      case 'max':
      case 'step':
      case 'zoom':
        this[name] = Number(newValue);
        break;
    }
  }

  _setValueAt(value, time) {
    const index = Math.floor((time / this.duration) * (this.array.length));
    this.array[index] = value;
    this._viewer.draw({
      start: index,
      length: 1,
    });
  }

  _updateViewerWidth() {
    if (!this._array) {
      this._viewer.array = new Float32Array(this.duration * this.frequency);
    }
  }

  draw() {
    return this._viewer.draw();
  }

  get frequency() {
    return this._frequency;
  }

  set frequency(value) {
    this._frequency = value;
    this._updateViewerWidth();
  }

  get duration() {
    return this._duration;
  }

  set duration(value) {
    this._duration = value;
    this._updateViewerWidth();
  }

  get currentTime() {
    return this._currentTime;
  }

  set currentTime(value) {
    if (this._currentTime === value) {
      return;
    }
    this._currentTime = value;
    if (this.value !== this._previousValue && !this._snap) {
      this.dispatchEvent(new Event('change', {
        bubbles: true,
      }));
      this._previousValue = this.value;
    }
  }

  get array() {
    return this._viewer.array;
  }

  set array(value) {
    this._array = this._viewer.array = value;
  }

  get value() {
    return this.array[Math.floor((this.currentTime / this.duration) * (this._viewer.width - 1))];
  }

  set value(value) {
    this._setValueAt(value, this.currentTime);
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
}

if (!customElements.get('damo-input-signal-array')) {
  customElements.define('damo-input-signal-array', class DamoArraySignalInputElement extends ArraySignalInputElement { });
}
