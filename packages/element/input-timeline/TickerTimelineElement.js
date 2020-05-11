import AnimationTickerElement from '../element-animation-ticker/index.js';
import Ticker from '../core/util/Ticker.js';

const PADDING_RATIO = .2;

class TickerTimelineElement extends AnimationTickerElement {
  constructor() {
    super();

    this.noautoplay = true;

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          width: 300px;
          height: 20px;
          background: grey;
          font-family: monospace;
        }
        #tick {
          pointer-events: none;
          position: absolute;
          will-change: transform;
          left: 0;
          top: 0;
          width: 0;
          height: 100%;
        }
        #text {
          position: absolute;
          pointer-events: none;
          user-select: none;
          top: 2px;
          left: 0;
          transform: translateX(-50%);
          background: white;
          border-radius: 2px;
          height: calc(100% - 4px);
          box-shadow: 0 0 4px black;
        }
        #tip {
          position: absolute;
          top: 100%;
          left: 0;
          border-left: 1px solid red;
        }
      </style>
      <div id="tick">
        <div id="text">100</div>
        <div id="tip"></div>
      </div>
    `;

    this.scale = 10;
    this._shift = 0;
    this._currentTime = 0;

    this._tick = this.shadowRoot.querySelector('#tick');
    this._tickText = this.shadowRoot.querySelector('#text');
    this._tickTip = this.shadowRoot.querySelector('#tip');
    this._tickAreaWidth = 0;

    this._pointerOffsetX = 0;
    this._pausedBeforeInteraction = false;
    const updateCurrentTimeFromPosition = () => {
      let currentPosition = this._pointerOffsetX + this.shift;
      const padding = this._tickAreaWidth * PADDING_RATIO;
      const right = this._tickAreaWidth - padding;
      if (this._pointerOffsetX > right) {
        currentPosition += (this._pointerOffsetX - right) * .01;
      } else if (this._pointerOffsetX < padding && this.shift) {
        currentPosition += (this._pointerOffsetX - padding) * .01;
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
      this._updatePositionFromCurrentTime();
    });
    resizeObserver.observe(this);
  }

  _updatePositionFromCurrentTime() {
    if (!this._tickAreaWidth) {
      return;
    }
    let x = this.currentTime * this.scale - this.shift;
    const padding = this._tickAreaWidth * PADDING_RATIO;
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
    this._tickTip.style.height = `${this._tickHeight}px`;
  }

  get currentTime() {
    return this._currentTime;
  }

  set currentTime(value) {
    value = Math.max(0, value);
    this._currentTime = value;
    this._tickText.textContent = `${this._currentTime.toFixed(1)}s`;
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