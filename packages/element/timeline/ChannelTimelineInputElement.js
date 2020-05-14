class ArrayInputElement extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          height: 20px;
          width: 360px;
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

    this._canvas = this.shadowRoot.querySelector('canvas');
    this._context = this._canvas.getContext('2d');
    this._scrollLeft = 0;
    this._zoom = 1;
    this._step = 1;
    this.startFrame = 0;
    this.color = 'white';
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

  connectedCallback() {
    this._update();
  }

  get keyframes() {
    return this._keyframes;
  }

  set keyframes(value) {
    this._keyframes = value;
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

  _update() {
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._context.fillStyle = this.color;
    this._context.beginPath();
    for (const keyframe of this.keyframes) {
      const x = keyframe * this.zoom - this.scrollLeft;
      this._context.fillRect(x, this._canvas.height * .25, this.zoom * this._step, this._canvas.height * .5);
    }
  }
}

if (!customElements.get('damo-input-array')) {
  customElements.define('damo-input-array', class DamoArrayInputElement extends ArrayInputElement { });
}
