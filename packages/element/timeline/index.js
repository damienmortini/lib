import './HeadTimelineElement.js';

export default class TimelineInputElement extends HTMLElement {
  static get observedAttributes() {
    return ['zoom', 'length'];
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
          overflow: auto;
        }
        :host::before {
          content: "";
          grid-row: 1;
          grid-row: 1;
        }
        damo-timeline-head {
          width: 100%;
          z-index: 1;
          grid-row: 1;
          grid-column: 2;
          position: sticky;
          top: 0;
        }
        ::slotted(:not(header):not(footer)) {
          grid-column: 2;
          width: 100%;
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
      <damo-timeline-head></damo-timeline-head>
      <slot></slot>
    `;

    this._zoom = 1;
    this._timelineHead = this.shadowRoot.querySelector('damo-timeline-head');
    this._slot = this.shadowRoot.querySelector('slot');

    this._channels = new Set();

    this._slot.addEventListener('slotchange', (event) => {
      const elements = this._slot.assignedElements({ flatten: true });
      this._channels.clear();
      for (const element of elements) {
        if (element.tagName !== 'HEADER' && element.tagName !== 'FOOTER') {
          this._channels.add(element);
          element.position = this.position;
        }
      }
    });

    this._slot.addEventListener('wheel', (event) => {
      event.preventDefault();
      if (event.deltaY < 0) {
        this.position -= 1 / this.zoom;
      } else {
        this.position += 1 / this.zoom;
      }
    });

    this._timelineHead.addEventListener('wheel', (event) => {
      event.preventDefault();
      if (event.deltaY > 0) {
        this.zoom *= .95;
      } else {
        this.zoom /= .95;
      }
    });

    this._timelineHead.addEventListener('change', () => {
      this.position = this._timelineHead.position;
    });

    this._timelineHead.addEventListener('scroll', () => {
      const scrollRatio = (this._timelineHead.scrollLeft / (this._timelineHead.scrollWidth - this._timelineHead.offsetWidth));
      for (const channel of this._channels) {
        channel.scrollLeft = scrollRatio * (channel.scrollWidth - channel.offsetWidth);
      }
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'zoom':
      case 'length':
        this[name] = Number(newValue);
        break;
    }
  }

  get zoom() {
    return this._zoom;
  }

  set zoom(value) {
    this._zoom = Math.max(value, 1);
    this._timelineHead.zoom = this._zoom;
    for (const channel of this._channels) {
      channel.zoom = this._zoom;
    }
  }

  get position() {
    return this._timelineHead.position;
  }

  set position(value) {
    this._timelineHead.position = value;
    for (const channel of this._channels) {
      if (channel.position !== undefined) {
        channel.position = value;
      }
    }
  }

  get length() {
    return this._timelineHead.length;
  }

  set length(value) {
    this._timelineHead.length = value;
    for (const channel of this._channels) {
      channel.length = value;
    }
  }
}

if (!customElements.get('damo-timeline')) {
  customElements.define('damo-timeline', class extends TimelineInputElement { });
}
