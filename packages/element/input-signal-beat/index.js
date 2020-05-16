export default class BeatSignalInputElement extends HTMLElement {
  static get observedAttributes() {
    return ['beats', 'min', 'max', 'step', 'zoom'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          height: 20px;
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

    this._canvas = this.shadowRoot.querySelector('canvas');
    this._context = this._canvas.getContext('2d');

    this._value = NaN;
    this._position = 0;
    this._scrollLeft = 0;
    this._width = 1;
    this._zoom = 1;
    this._max = 1;
    this._step = undefined;
    this.startFrame = 0;
    this.color = 'white';

    const drawBinded = this.draw.bind(this);
    let requestAnimationFrameID = -1;
    class Beats extends Set {
      add(value) {
        const returnValue = super.add(value);
        cancelAnimationFrame(requestAnimationFrameID);
        requestAnimationFrameID = requestAnimationFrame(drawBinded);
        return returnValue;
      }
      delete(value) {
        const returnValue = super.delete(value);
        cancelAnimationFrame(requestAnimationFrameID);
        requestAnimationFrameID = requestAnimationFrame(drawBinded);
        return returnValue;
      }
      clear() {
        super.clear();
        cancelAnimationFrame(requestAnimationFrameID);
        requestAnimationFrameID = requestAnimationFrame(drawBinded);
      }
    };
    this._beats = new Beats();

    let previousbeat = null;
    let decimals = 0;
    const preventContextMenu = (event) => event.preventDefault();
    const pointerDown = (event) => {
      decimals = this.step % 1 ? String(this.step).split('.')[1].length : 0;
      this._canvas.setPointerCapture(event.pointerId);
      this._canvas.addEventListener('pointermove', pointerMove);
      this._canvas.addEventListener('pointerup', pointerUp);
      this._canvas.addEventListener('pointerout', pointerUp);
      window.addEventListener('contextmenu', preventContextMenu);
      pointerMove(event);
    };
    const pointerMove = (event) => {
      let newbeat = ((event.offsetX + this.scrollLeft) / this.scrollWidth) * this.max;
      if (this.step) {
        newbeat = Math.round(newbeat / this.step) * this.step;
      }
      previousbeat = previousbeat !== null ? previousbeat : newbeat;
      const startBeat = newbeat > previousbeat ? previousbeat : newbeat;
      const endBeat = newbeat > previousbeat ? newbeat : previousbeat;
      if (event.buttons === 1) {
        if (this.step) {
          for (let beat = startBeat; beat <= endBeat; beat += this.step) {
            beat = Number(beat.toFixed(decimals));
            this.beats.add(beat);
          }
        } else {
          this.beats.add(newbeat);
        }
      } else {
        for (const beat of this.beats) {
          if (beat >= startBeat && beat <= endBeat) {
            this.beats.delete(beat);
          }
        }
      }
      previousbeat = newbeat;
      this.draw();
      this.dispatchEvent(new Event('input'));
    };
    const pointerUp = (event) => {
      previousbeat = null;
      this._canvas.releasePointerCapture(event.pointerId);
      this._canvas.removeEventListener('pointermove', pointerMove);
      this._canvas.removeEventListener('pointerup', pointerUp);
      this._canvas.removeEventListener('pointerout', pointerUp);
      requestAnimationFrame(() => {
        window.removeEventListener('contextmenu', preventContextMenu);
      });
    };
    this._canvas.addEventListener('pointerdown', pointerDown);

    const resizeObserver = new ResizeObserver((entries) => {
      this._width = entries[0].contentRect.width;
      this._canvas.width = entries[0].contentRect.width * devicePixelRatio;
      this._canvas.height = entries[0].contentRect.height * devicePixelRatio;
      this.draw();
    });
    resizeObserver.observe(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'beats':
        const newBeats = new Function(`return ${newValue}`)();
        this.beats.clear();
        for (const beat of newBeats) {
          this.beats.add(beat);
        }
        break;
      case 'min':
      case 'max':
      case 'step':
      case 'zoom':
        this[name] = Number(newValue);
        break;
    }
  }

  get beats() {
    return this._beats;
  }

  get scrollWidth() {
    return this._width * this.zoom;
  }

  get scrollLeft() {
    return this._scrollLeft;
  }

  set scrollLeft(value) {
    this._scrollLeft = Math.max(0, Math.min(this.scrollWidth - this._width, value));
    this.draw();
  }

  get zoom() {
    return this._zoom;
  }

  set zoom(value) {
    this._zoom = value;
    this.draw();
  }

  get step() {
    return this._step;
  }

  set step(value) {
    this._step = value;
    this.draw();
  }

  get max() {
    return this._max;
  }

  set max(value) {
    this._max = value;
    this.draw();
  }

  get position() {
    return this._position;
  }

  set position(value) {
    if (value === this._position) {
      return;
    }
    const backward = value < this._position;
    const start = backward ? value : this._position;
    const end = backward ? this._position : value;
    let changed = false;
    let maxBeat = -Infinity;
    let minBeat = Infinity;
    for (const beat of this.beats) {
      if (beat >= start && beat <= end) {
        changed = true;
        maxBeat = Math.max(maxBeat, beat);
        minBeat = Math.min(minBeat, beat);
      }
    }
    this._position = value;
    if (changed) {
      this._value = backward ? minBeat : maxBeat;
      this.dispatchEvent(new Event('change', { bubbles: true }));
    }
    this.draw();
  }

  get value() {
    return this._value;
  }

  get name() {
    return this.getAttribute('name');
  }

  set name(value) {
    this.setAttribute('name', value);
  }

  draw() {
    this._context.resetTransform();
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);

    this._context.strokeStyle = 'rgba(0, 0, 0, .2)';
    if (this.step) {
      let stepWidth = this.step / this.max * this.zoom * this._width;
      while (stepWidth < 1) {
        stepWidth *= 2;
      }
      for (let position = 0; position < this._width; position += stepWidth) {
        const x = position - (this.scrollLeft % stepWidth);
        this._context.beginPath();
        this._context.moveTo(x, 0);
        this._context.lineTo(x, this._canvas.height);
        this._context.stroke();
      }
    }

    this._context.strokeStyle = 'red';
    const position = (this.position / this.max) * this.zoom * this._canvas.width - this.scrollLeft;
    this._context.beginPath();
    this._context.moveTo(position, 0);
    this._context.lineTo(position, this._canvas.height);
    this._context.stroke();

    this._context.fillStyle = this.color;
    this._context.strokeStyle = 'black';
    const size = Math.min(10, this._canvas.height * .5);
    for (const beat of this.beats) {
      this._context.resetTransform();
      const x = (beat / this.max) * this._width * this.zoom - this.scrollLeft;
      this._context.translate(x, this._canvas.height * .5);
      this._context.rotate(Math.PI * .25);
      this._context.fillRect(-size * .5, -size * .5, size, size);
      this._context.strokeRect(-size * .5, -size * .5, size, size);
    }
  }
}

if (!customElements.get('damo-input-signal-beat')) {
  customElements.define('damo-input-signal-beat', class extends BeatSignalInputElement { });
}
