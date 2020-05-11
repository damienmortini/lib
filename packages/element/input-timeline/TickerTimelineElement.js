import AnimationTickerElement from '../element-animation-ticker/index.js';
import Ticker from '../core/util/Ticker.js';

class TickerTimelineElement extends AnimationTickerElement {
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
        }
        #tick {
          pointer-events: none;
          margin-left: -5px;
          position: absolute;
          left: 0;
          top: 5px;
          width: 10px;
        }
      </style>
      <svg id="tick">
        <polyline fill="red" fill="none" points="0 0 5 5 10 0" />
        <line stroke="red" x1="5" y1="5" x2="5" y2="10" />
      </svg>
    `;

    this.scale = 10;
    this._shift = 0;
    this._currentTime = 0;

    this._tick = this.shadowRoot.querySelector('#tick');
    this._tickLine = this.shadowRoot.querySelector('#tick line');
    this._tickAreaWidth = 0;

    this._pointerOffsetX = 0;
    this._pausedBeforeInteraction = false;
    const updateCurrentTimeFromPosition = () => {
      let currentPosition = this._pointerOffsetX + this.shift;
      const padding = this._tickAreaWidth * .2;
      const right = this._tickAreaWidth - padding;
      if (this._pointerOffsetX > right) {
        currentPosition += this._pointerOffsetX - right;
      } else if (this._pointerOffsetX < padding && this.shift) {
        currentPosition += this._pointerOffsetX - padding;
      }
      this.currentTime = currentPosition / this.scale;
    };
    const pointerDown = (event) => {
      this.setPointerCapture(event.pointerId);
      this.addEventListener('pointermove', pointerMove);
      this.addEventListener('pointerup', pointerUp);
      this.addEventListener('pointerout', pointerUp);
      pointerMove(event);
      this._pausedBeforeInteraction = this.paused;
      this.pause();
      Ticker.add(updateCurrentTimeFromPosition);
    };
    const pointerMove = (event) => {
      this._pointerOffsetX = event.offsetX;
    };
    const pointerUp = (event) => {
      Ticker.delete(updateCurrentTimeFromPosition);
      this.releasePointerCapture(event.pointerId);
      this.removeEventListener('pointermove', pointerMove);
      this.removeEventListener('pointerup', pointerUp);
      this.removeEventListener('pointerout', pointerUp);
      if (!this._pausedBeforeInteraction) {
        this.play();
      }
    };
    this.addEventListener('pointerdown', pointerDown);

    this.addEventListener('contextmenu', (event) => event.preventDefault());
    const resizeObserver = new ResizeObserver((entries) => {
      this._tickAreaWidth = entries[0].contentRect.width;
    });
    resizeObserver.observe(this);
  }

  _updatePositionFromCurrentTime() {
    let x = this.currentTime * this.scale - this.shift;
    const padding = this._tickAreaWidth * .2;
    const right = this._tickAreaWidth - padding;
    if (x > right) {
      this.shift += x - right;
      x = right;
    } else if (x < padding && this.shift) {
      this.shift += x - padding;
      x = padding;
    } else {
      x = Math.max(0, x);
    }
    this._tick.style.transform = `translateX(${x}px)`;
  }

  get tickHeight() {
    return this._tickHeight;
  }

  set tickHeight(value) {
    this._tickHeight = value;
    this._tickLine.setAttribute('y2', `${this._tickHeight}`);
  }

  get currentTime() {
    return this._currentTime;
  }

  set currentTime(value) {
    value = Math.max(0, value);
    if (this._currentTime === value) {
      return;
    }
    this._currentTime = value;
    this._updatePositionFromCurrentTime();
    this.dispatchEvent(new Event('timeupdate'));
  }

  get shift() {
    return this._shift;
  }

  set shift(value) {
    value = Math.max(0, value);
    if (this._shift === value) {
      return;
    }
    this._shift = value;
    this.dispatchEvent(new Event('shiftupdate'));
  }

  update() {
    this.currentTime += Ticker.deltaTime;
  }
}

if (!customElements.get('damo-timeline-ticker')) {
  customElements.define('damo-timeline-ticker', class DamoTickerTimelineElement extends TickerTimelineElement { });
}