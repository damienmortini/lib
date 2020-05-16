import Ticker from '../core/util/Ticker.js';

const SIDE_MOVEMENT_SPEED = .2;
const PADDING_RATIO = .25;

class HeadTimelineElement extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          width: 300px;
          height: 20px;
          background: grey;
          font-family: monospace;
          touch-action: none;
        }
        #tick {
          position: absolute;
          will-change: transform;
          left: 0;
          height: 100%;
          user-select: none;
          top: 2px;
          left: 0;
          padding: 0;
          background: white;
          border-radius: 2px;
          height: calc(100% - 4px);
          box-shadow: 0 0 4px black;
        }
      </style>
      <div id="tick">0.00</div>
    `;

    this.zoom = 1;
    this._length = 1;
    this._scrollLeft = 0;
    this._position = 0;

    this._tick = this.shadowRoot.querySelector('#tick');
    this._width = 1;

    let pointerOffsetX = 0;
    const updatePositionFromPosition = () => {
      let currentPosition = pointerOffsetX + this.scrollLeft;
      const padding = this._width * PADDING_RATIO;
      const right = this._width - padding;
      if (pointerOffsetX > right) {
        currentPosition += (pointerOffsetX - right) * SIDE_MOVEMENT_SPEED;
      } else if (pointerOffsetX < padding) {
        currentPosition += (pointerOffsetX - padding) * SIDE_MOVEMENT_SPEED;
      }
      this.position = (currentPosition / this._width) * this.length / this.zoom;
      this.dispatchEvent(new Event('input'));
    };
    const pointerDown = (event) => {
      if (!(event.buttons & 1)) {
        return;
      }
      this.setPointerCapture(event.pointerId);
      this.addEventListener('pointermove', pointerMove);
      this.addEventListener('pointerup', pointerUp);
      this.addEventListener('pointerout', pointerUp);
      pointerMove(event);
      Ticker.add(updatePositionFromPosition);
    };
    const pointerMove = (event) => {
      pointerOffsetX = event.offsetX;
    };
    const pointerUp = (event) => {
      Ticker.delete(updatePositionFromPosition);
      this.releasePointerCapture(event.pointerId);
      this.removeEventListener('pointermove', pointerMove);
      this.removeEventListener('pointerup', pointerUp);
      this.removeEventListener('pointerout', pointerUp);
    };
    this.addEventListener('pointerdown', pointerDown);

    const resizeObserver = new ResizeObserver((entries) => {
      this._width = entries[0].contentRect.width;
      this._updatePositionFromInput();
    });
    resizeObserver.observe(this);
  }

  _updatePositionFromInput() {
    if (!this._width) {
      return;
    }
    const edgeX = (this.position / this.length) * this._width * this.zoom - this.scrollLeft;
    const padding = this._width * PADDING_RATIO;
    const right = this._width - padding;
    if (edgeX > right) {
      this.scrollLeft += (edgeX - right) * SIDE_MOVEMENT_SPEED;
    } else if (edgeX < padding) {
      this.scrollLeft += (edgeX - padding) * SIDE_MOVEMENT_SPEED;
    }
    let x = (this.position / this.length) * this._width * this.zoom - this.scrollLeft;
    x = Math.min(this._width, Math.max(0, x));
    this._tick.style.transform = `translateX(${x}px) translateX(-50%)`;
  }

  get position() {
    return this._position;
  }

  set position(value) {
    value = Math.min(Math.max(0, value), this.length);
    if (this.position === value) {
      return;
    }
    this._position = value;
    this._tick.textContent = `${this._position.toFixed(2)}`;
    this._updatePositionFromInput();
    this.dispatchEvent(new Event('change'));
  }

  get length() {
    return this._length;
  }

  set length(value) {
    this._length = value;
    this.position = Math.min(this.position, this.length);
  }

  get scrollLeft() {
    return this._scrollLeft;
  }

  set scrollLeft(value) {
    value = Math.min(Math.max(0, value), this._width * (this.zoom - 1));
    if (this._scrollLeft === value) {
      return;
    }
    this._scrollLeft = value;
    this.dispatchEvent(new Event('scroll'));
  }

  get scrollWidth() {
    return this._width * this.zoom;
  }
}

if (!customElements.get('damo-timeline-head')) {
  customElements.define('damo-timeline-head', class extends HeadTimelineElement { });
}
