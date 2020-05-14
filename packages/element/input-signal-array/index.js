import '../element-viewer-array/index.js';

export default class ArraySignalInputElement extends HTMLElement {
  static get observedAttributes() {
    return ['array', 'time', 'frequency', 'duration'];
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
    this._duration = 1;
    this._frequency = 10;
    this._previousValue = undefined;

    const resizeObserver = new ResizeObserver((entries) => {
      this._width = entries[0].contentRect.width;
      this._height = entries[0].contentRect.height;
    });
    resizeObserver.observe(this);

    let previousTime = null;
    const pointerDown = (event) => {
      if (!(event.buttons & 1)) {
        return;
      }
      this._viewer.setPointerCapture(event.pointerId);
      this._viewer.addEventListener('pointermove', pointerMove);
      this._viewer.addEventListener('pointerup', pointerUp);
      this._viewer.addEventListener('pointerout', pointerUp);
      pointerMove(event);
    };
    const pointerMove = (event) => {
      let value = (1 - event.offsetY / this._height) * (this.max - this.min) + (this.min || 0);
      value = Math.max(Math.min(this.max, value), this.min);
      const newTime = (event.offsetX / this._width) * this.duration;
      previousTime = previousTime !== null ? previousTime : newTime;
      const startTime = Math.max(0, newTime > previousTime ? previousTime : newTime);
      const endTime = newTime > previousTime ? newTime : previousTime;
      const step = 1 / this.frequency;
      for (let time = startTime; time <= endTime; time += step) {
        this._setValueAt(value, time);
      }
      previousTime = newTime;
      this.dispatchEvent(new Event('input', {
        bubbles: true,
      }));
    };
    const pointerUp = (event) => {
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
        this[name] = Number(newValue);
        break;
    }
  }

  _setValueAt(value, time) {
    const index = Math.floor((time / this.duration) * (this._viewer.width - 1));
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
    this._viewer.width = this.frequency * this.duration;
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
    if (this.value !== this._previousValue) {
      this.dispatchEvent(new Event('change', {
        bubbles: true,
      }));
    }
    this._previousValue = this.value;
  }

  get array() {
    return this._viewer.array;
  }

  set array(value) {
    this._array = this._viewer.array = value;
  }

  get value() {
    return this.array[Math.floor(this.currentTime * this.frequency)];
  }

  set value(value) {
    this._setValueAt(value, this.currentTime);
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

  get name() {
    return this.getAttribute('name');
  }

  set name(value) {
    this.setAttribute('name', value);
  }
}

if (!customElements.get('damo-input-signal-array')) {
  customElements.define('damo-input-signal-array', class DamoArraySignalInputElement extends ArraySignalInputElement { });
}
