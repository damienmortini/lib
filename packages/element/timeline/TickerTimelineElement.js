import AnimationTickerElement from '../element-animation-ticker/index.js';
import Ticker from '../core/util/Ticker.js';

const SIDE_MOVEMENT_SPEED = .2;
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
          touch-action: none;
        }
        #tick {
          position: absolute;
          will-change: transform;
          left: 0;
          top: 0;
          width: 0;
          height: 100%;
        }
        #text {
          position: absolute;
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
          pointer-events: none;
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

    this.zoom = 1;
    this._duration = 1;
    this._scrollLeft = 0;
    this._currentTime = 0;

    this._tick = this.shadowRoot.querySelector('#tick');
    this._tickText = this.shadowRoot.querySelector('#text');
    this._tickTip = this.shadowRoot.querySelector('#tip');
    this._width = 0;

    this._pointerOffsetX = 0;
    this._pausedBeforeInteraction = false;
    const updateCurrentTimeFromPosition = () => {
      let currentPosition = this._pointerOffsetX + this.scrollLeft;
      const padding = this._width * PADDING_RATIO;
      const right = this._width - padding;
      // if (this._pointerOffsetX > right) {
      //   currentPosition += (this._pointerOffsetX - right) * SIDE_MOVEMENT_SPEED;
      // } else if (this._pointerOffsetX < padding && this.scrollLeft) {
      //   currentPosition += (this._pointerOffsetX - padding) * SIDE_MOVEMENT_SPEED;
      // }
      this.currentTime = (currentPosition / this._width) * this.duration / this.zoom;
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

    const resizeObserver = new ResizeObserver((entries) => {
      this._width = entries[0].contentRect.width;
      this._updatePositionFromCurrentTime();
    });
    resizeObserver.observe(this);
  }

  _updatePositionFromCurrentTime() {
    if (!this._width) {
      return;
    }
    let x = (this.currentTime / this.duration) * this._width * this.zoom - this.scrollLeft;
    // const padding = this._width * PADDING_RATIO;
    // const right = this._width - padding;
    // if (x > right) {
    //   this.scrollLeft += (x - right) * SIDE_MOVEMENT_SPEED;
    //   x = right;
    // } else if (x < padding && this.scrollLeft) {
    //   this.scrollLeft += (x - padding) * SIDE_MOVEMENT_SPEED;
    //   x = padding;
    // } else {
    //   x = Math.max(0, x);
    // }
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
    value = Math.min(Math.max(0, value), this.duration);
    this._currentTime = value;
    this._tickText.textContent = `${this._currentTime.toFixed(1)}s`;
    this._updatePositionFromCurrentTime();
    if (this._currentTime === this.duration) {
      this.pause();
    }
    this.dispatchEvent(new Event('timeupdate'));
  }

  get duration() {
    return this._duration;
  }

  set duration(value) {
    this._duration = value;
    this.currentTime = Math.min(this.currentTime, this.duration);
  }

  get scrollLeft() {
    return this._scrollLeft;
  }

  set scrollLeft(value) {
    value = Math.max(0, value);
    if (this._scrollLeft === value) {
      return;
    }
    this._scrollLeft = value;
    this.dispatchEvent(new Event('scrollLeftupdate'));
  }

  update() {
    this.currentTime += Ticker.deltaTime;
  }
}

if (!customElements.get('damo-timeline-ticker')) {
  customElements.define('damo-timeline-ticker', class extends TickerTimelineElement { });
}
