import './TickerTimelineElement.js';
import './ChannelTimelineInputElement.js';

export default class TimelineInputElement extends HTMLElement {
  static get observedAttributes() {
    return ['scale'];
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
      </div>
      <div id="timeline">
        <damo-timeline-ticker></damo-timeline-ticker>
        <div id="channels"></div>
      </div>
    `;

    this._scale = 1;
    this._channelsContainer = this.shadowRoot.querySelector('#channels');
    this._timelineTicker = this.shadowRoot.querySelector('damo-timeline-ticker');

    this._channelsContainer.addEventListener('wheel', (event) => {
      event.preventDefault();
      if (event.deltaY < 0) {
        this.currentTime -= 20 / this.scale;
      } else {
        this.currentTime += 20 / this.scale;
      }
    });

    // this._timelineTicker.addEventListener('wheel', (event) => {
    //   event.preventDefault();
    //   if (event.deltaY < 0) {
    //     this.scale *= .95;
    //   } else {
    //     this.scale /= .95;
    //   }
    // });

    let previousTime = 0;
    this._timelineTicker.addEventListener('timeupdate', () => {
      for (const channel of this._channels) {
        for (const keyframe of channel.keyframes) {
          if (keyframe >= previousTime && keyframe < this.currentTime) {
            this.dispatchEvent(new CustomEvent('input', {
              detail: {
                name: channel.name,
                time: keyframe,
                color: channel.color,
              },
            }));
          }
        }
      }
      previousTime = this.currentTime;
    });

    this._timelineTicker.addEventListener('shiftupdate', () => {
      for (const channel of this._channels) {
        channel.shift = this._timelineTicker.shift;
      }
    });

    this._channels = new Set();

    /**
     * Controls
     */
    this._playButton = this.shadowRoot.querySelector('#play');
    this._pauseButton = this.shadowRoot.querySelector('#pause');

    this._playButton.addEventListener('click', () => {
      this.play();
    });
    this._pauseButton.addEventListener('click', () => {
      this.pause();
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'scale':
        this.scale = Number(newValue);
        break;
    }
  }

  addChannel({ name, key, color, keyframes, step }) {
    const channel = document.createElement('damo-input-timeline-channel');
    channel.name = name;
    channel.color = color;
    channel.keyframes = keyframes;
    channel.scale = this.scale;
    channel.step = step;
    this._channels.add(channel);
    this._channelsContainer.appendChild(channel);
    this._timelineTicker.tickHeight = this._channelsContainer.clientHeight;
  }

  get scale() {
    return this._scale;
  }

  set scale(value) {
    // const scaleDifference = value - this._scale;
    this._scale = value;
    this._timelineTicker.scale = this._scale;
    for (const channel of this._channels) {
      channel.scale = this._scale;
    }
    // console.log(scaleDifference);
    // this._timelineTicker.shift += scaleDifference * this._timelineTicker.offsetWidth;
  }

  get time() {
    return this._time;
  }

  set time(value) {
    this._time = value;
  }

  get currentTime() {
    return this._timelineTicker.currentTime;
  }

  set currentTime(value) {
    this._timelineTicker.currentTime = value;
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
