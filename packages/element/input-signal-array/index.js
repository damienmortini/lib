export default class ArraySignalInputElement extends HTMLElement {
  static get observedAttributes() {
    return ['array', 'position'];
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

    this._array = [];

    this._canvas = this.shadowRoot.querySelector('canvas');
    this._context = this._canvas.getContext('2d');
    this._scrollLeft = 0;
    this._zoom = 1;
    this._step = 1;
    this.startFrame = 0;
    this.color = undefined;
    this.keyframes = new Set();

    let previousKeyframe = null;
    let decimals = 0;
    const pointerDown = (event) => {
      decimals = this._step % 1 ? String(this._step).split('.')[1].length : 0;
      this._canvas.setPointerCapture(event.pointerId);
      this._canvas.addEventListener('pointermove', pointerMove);
      this._canvas.addEventListener('pointerup', pointerUp);
      this._canvas.addEventListener('pointerout', pointerUp);
      pointerMove(event);
    };
    const pointerMove = (event) => {
      const newKeyframe = Math.floor((event.offsetX + this.scrollLeft) / this._step / this.zoom) * this._step;
      previousKeyframe = previousKeyframe !== null ? previousKeyframe : newKeyframe;
      const startKeyframe = newKeyframe > previousKeyframe ? previousKeyframe : newKeyframe;
      const endKeyframe = newKeyframe > previousKeyframe ? newKeyframe : previousKeyframe;
      for (let keyframe = startKeyframe; keyframe <= endKeyframe; keyframe += this._step) {
        keyframe = Number(keyframe.toFixed(decimals));
        if (event.buttons === 1) {
          this.keyframes.add(keyframe);
        } else {
          this.keyframes.delete(keyframe);
        }
      }
      previousKeyframe = newKeyframe;
      this._update();
    };
    const pointerUp = (event) => {
      previousKeyframe = null;
      this._canvas.releasePointerCapture(event.pointerId);
      this._canvas.removeEventListener('pointermove', pointerMove);
      this._canvas.removeEventListener('pointerup', pointerUp);
      this._canvas.removeEventListener('pointerout', pointerUp);
    };
    this._canvas.addEventListener('pointerdown', pointerDown);
    this._canvas.addEventListener('contextmenu', (event) => event.preventDefault());

    const resizeObserver = new ResizeObserver((entries) => {
      this._canvas.width = entries[0].contentRect.width * devicePixelRatio;
      this._canvas.height = entries[0].contentRect.height * devicePixelRatio;
      this._update();
    });
    resizeObserver.observe(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'array':
        this.array = new Function(`return ${newValue}`)();
        break;
      case 'position':
        this.position = Number(newValue);
        break;
    }
  }

  connectedCallback() {
    this._update();
  }

  get scrollLeft() {
    return this._scrollLeft;
  }

  set scrollLeft(value) {
    this._scrollLeft = value;
    this._update();
  }

  get zoom() {
    return this._zoom;
  }

  set zoom(value) {
    this._zoom = value;
    this._update();
  }

  get step() {
    return this._step;
  }

  set step(value) {
    this._step = value;
    this._update();
  }

  get array() {
    return this._array;
  }

  set array(value) {
    this._array = value;
    this._update();
  }

  get position() {
    return this._position;
  }

  set position(value) {
    this._position = value;
  }

  get value() {
    return this._array[Math.floor(this._position * (this._array.length - 1))];
  }

  set value(value) {
    this._array[Math.floor(this._position * (this._array.length - 1))] = value;
    this._update();
  }

  _update() {
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._context.fillStyle = this.color;
    this._context.beginPath();
    for (const value of this.array) {
      const x = value * this.zoom - this.scrollLeft;
      this._context.fillRect(x, this._canvas.height * .25, this.zoom * this._step, this._canvas.height * .5);
    }
  }
}

if (!customElements.get('damo-input-signal-array')) {
  customElements.define('damo-input-signal-array', class DamoArraySignalInputElement extends ArraySignalInputElement { });
}
