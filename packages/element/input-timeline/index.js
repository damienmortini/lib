import './TickerTimelineElement.js';
import './ChannelTimelineInputElement.js';

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
