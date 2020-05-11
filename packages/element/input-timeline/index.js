import Ticker from '../core/util/Ticker.js';
import AnimationTickerElement from '../element-animation-ticker/index.js';

export default class TimelineInputElement extends HTMLElement {
  static get observedAttributes() {
    return [];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: grid;
          grid-template-columns: auto 1fr;
          align-items: center;
          width: 300px;
          gap: 10px;
        }
        #controls button {
          width: 60px;
          display: block;
          cursor: pointer;
        }
        damo-timeline-ticker {
          width: 100%;
          z-index: 1;
        }
        damo-input-timeline-channel {
          width: 100%;
          margin-bottom: 2px;
        }
      </style>
      <div id="controls">
        <button id="play">Play</button>
        <button id="pause">Pause</button>
        <button id="record">Record</button>
      </div>
      <div id="timeline">
        <damo-timeline-ticker></damo-timeline-ticker>
        <div id="channels"></div>
      </div>
    `;

    this._channelsContainer = this.shadowRoot.querySelector('#channels');
    this._timelineTicker = this.shadowRoot.querySelector('damo-timeline-ticker');

    this._timelineTicker.addEventListener('shiftupdate', () => {
      this.shift = this._timelineTicker.shift;
    });

    this._channels = new Set();

    this._shift = 0;

    /**
     * Controls
     */
    this._playButton = this.shadowRoot.querySelector('#play');
    this._pauseButton = this.shadowRoot.querySelector('#pause');

    this._playButton.addEventListener('click', () => {
      this._timelineTicker.play();
    });
    this._pauseButton.addEventListener('click', () => {
      this._timelineTicker.pause();
    });
  }

  addChannel({ name, key, color, keyframes }) {
    const channel = document.createElement('damo-input-timeline-channel');
    channel.color = color;
    channel.keyframes = keyframes;
    this._channels.add(channel);
    this._channelsContainer.appendChild(channel);
    this._timelineTicker.tickHeight = this._channelsContainer.clientHeight + 15;
  }

  get time() {
    return this._time;
  }

  set time(value) {
    this._time = value;
  }

  get shift() {
    return this._shift;
  }

  set shift(value) {
    this._shift = Math.max(0, value);
    for (const channel of this._channels) {
      channel.shift = this._shift;
    }
  }

  get currentTime() {
    return this._currentTime;
  }

  set currentTime(value) {
    this._currentTime = value;
  }

  get data() {
    return this._data;
  }

  set data(value) {
    this._data = value;
  }

  play() {
    this._timelineTicker.play();
  }

  pause() {
    this._timelineTicker.pause();
  }

  get paused() {
    return this._timelineTicker.paused;
  }
}

if (!customElements.get('damo-input-timeline')) {
  customElements.define('damo-input-timeline', class DamoTimelineInputElement extends TimelineInputElement { });
}

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
    console.log(this._currentTime);
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
    this.step = 10;
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
      const keyframe = Math.floor((event.offsetX + this.shift) / this.step);
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

  _update() {
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._context.fillStyle = this.color;
    this._context.beginPath();
    for (const keyframe of this.keyframes) {
      const x = keyframe * this.step - this.shift;
      this._context.fillRect(x, this._canvas.height * .25, this.step, this._canvas.height * .5);
    }
  }
}

if (!customElements.get('damo-input-timeline-channel')) {
  customElements.define('damo-input-timeline-channel', class DamoChannelTimelineInputElement extends ChannelTimelineInputElement { });
}
