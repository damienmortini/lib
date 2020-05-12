class ChannelTimelineInputElement extends HTMLElement {
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
    this._shift = 0;
    this._scale = 1;
    this.startFrame = 0;
    this.color = 'white';
    this.keyframes = new Set();

    const pointerDown = (event) => {
      this._canvas.setPointerCapture(event.pointerId);
      this._canvas.addEventListener('pointermove', pointerMove);
      this._canvas.addEventListener('pointerup', pointerUp);
      this._canvas.addEventListener('pointerout', pointerUp);
      pointerMove(event);
    };
    const pointerMove = (event) => {
      const keyframe = Math.floor((event.offsetX + this.shift) / this.scale);
      if (event.buttons === 1) {
        this.keyframes.add(keyframe);
      } else {
        this.keyframes.delete(keyframe);
      }
      this._update();
    };
    const pointerUp = (event) => {
      this._canvas.releasePointerCapture(event.pointerId);
      this._canvas.removeEventListener('pointermove', pointerMove);
      this._canvas.removeEventListener('pointerup', pointerUp);
      this._canvas.removeEventListener('pointerout', pointerUp);
    };
    this._canvas.addEventListener('pointerdown', pointerDown);
    this._canvas.addEventListener('contextmenu', (event) => event.preventDefault());

    const resizeObserver = new ResizeObserver((entries) => {
      this._canvas.width = entries[0].contentRect.width;
      this._canvas.height = entries[0].contentRect.height;
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

  get shift() {
    return this._shift;
  }

  set shift(value) {
    this._shift = value;
    this._update();
  }

  get scale() {
    return this._scale;
  }

  set scale(value) {
    this._scale = value;
    this._update();
  }

  _update() {
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._context.fillStyle = this.color;
    this._context.beginPath();
    for (const keyframe of this.keyframes) {
      const x = keyframe * this.scale - Math.floor(this.shift);
      this._context.fillRect(x, this._canvas.height * .25, this.scale, this._canvas.height * .5);
    }
  }
}

if (!customElements.get('damo-input-timeline-channel')) {
  customElements.define('damo-input-timeline-channel', class DamoChannelTimelineInputElement extends ChannelTimelineInputElement { });
}
