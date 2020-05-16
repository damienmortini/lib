import './TickerTimelineElement.js';

export default class TimelineInputElement extends HTMLElement {
  static get observedAttributes() {
    return ['zoom', 'duration'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: grid;
          width: 300px;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          justify-items: center;
        }
        :host::before {
          content: "";
          grid-row: 1;
          grid-row: 1;
        }
        damo-timeline-ticker {
          width: 100%;
          z-index: 1;
          grid-area: ticker;
          grid-row: 1;
          grid-column: 2;
        }
        ::slotted(:not(header):not(footer)) {
          grid-column: 2;
          width: 100%;
          height: 50px;
        }
        ::slotted(:not(header):not(footer):not(:last-child)) {
          margin-bottom: 1px;
        }
        ::slotted(header) {
          grid-column: 1;
          margin-right: 5px;
        }
        ::slotted(footer) {
          grid-column: 3;
          margin-left: 5px;
        }
      </style>
      <damo-timeline-ticker></damo-timeline-ticker>
      <slot></slot>
    `;

    this._zoom = 1;
    this._timelineTicker = this.shadowRoot.querySelector('damo-timeline-ticker');
    this._timelineSlot = this.shadowRoot.querySelector('slot');

    this._channels = [];

    this._timelineSlot.addEventListener('slotchange', (event) => {
      this._channels = this._timelineSlot.assignedElements({ flatten: true });
      for (const channel of this._channels) {
        for (const key of ['duration', 'currentTime', 'scrollLeft', 'zoom']) {
          if (key in channel) {
            channel[key] = this[key];
          }
        }
      }
      this._timelineTicker.tickHeight = this._timelineSlot.clientHeight;
    });

    this._timelineSlot.addEventListener('wheel', (event) => {
      event.preventDefault();
      if (event.deltaY < 0) {
        this.currentTime -= this.zoom;
      } else {
        this.currentTime += this.zoom;
      }
    });

    this._timelineTicker.addEventListener('wheel', (event) => {
      event.preventDefault();
      if (event.deltaY > 0) {
        this.zoom *= .95;
      } else {
        this.zoom /= .95;
      }
    });

    this._timelineTicker.addEventListener('timeupdate', () => {
      for (const channel of this._channels) {
        channel.currentTime = this.currentTime;
      }
      this.dispatchEvent(new Event('timeupdate', { bubbles: true }));
    });

    this._timelineTicker.addEventListener('input', () => {
      this.dispatchEvent(new Event('input', { bubbles: true }));
    });

    this._timelineTicker.addEventListener('scroll', () => {
      for (const channel of this._channels) {
        channel.scrollLeft = this._timelineTicker.scrollLeft;
      }
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'zoom':
      case 'duration':
        this[name] = Number(newValue);
        break;
    }
  }

  get zoom() {
    return this._zoom;
  }

  set zoom(value) {
    this._zoom = Math.max(value, 1);
    this._timelineTicker.zoom = this._zoom;
    for (const channel of this._channels) {
      channel.zoom = this._zoom;
    }
  }

  get currentTime() {
    return this._timelineTicker.currentTime;
  }

  set currentTime(value) {
    this._timelineTicker.currentTime = value;
  }

  get duration() {
    return this._timelineTicker.duration;
  }

  set duration(value) {
    this._timelineTicker.duration = value;
    for (const channel of this._channels) {
      channel.duration = value;
    }
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

if (!customElements.get('damo-timeline')) {
  customElements.define('damo-timeline', class extends TimelineInputElement { });
}
