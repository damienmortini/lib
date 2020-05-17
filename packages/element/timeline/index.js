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
        }
        ::slotted(:not(header):not(footer)) {
          grid-column: 2;
          width: 100%;
        }
        ::slotted(header) {
          grid-column: 1;
        }
        ::slotted(footer) {
          grid-column: 3;
        }
      </style>
      <damo-timeline-head></damo-timeline-head>
      <slot></slot>
    `;

    this.head = this.shadowRoot.querySelector('damo-timeline-head');

    this._zoom = 1;
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

    this.head.addEventListener('wheel', (event) => {
      event.preventDefault();
      if (event.deltaY > 0) {
        this.zoom *= .95;
      } else {
        this.zoom /= .95;
      }
    });

    this.head.addEventListener('change', () => {
      for (const channel of this._channels) {
        if (channel.position !== undefined) {
          channel.position = this.position;
        }
      }
    });

    this.head.addEventListener('scroll', () => {
      const scrollRatio = (this.head.scrollLeft / (this.head.scrollWidth - this.head.offsetWidth));
      for (const channel of this._channels) {
        channel.scrollLeft = scrollRatio * (channel.scrollWidth - channel.offsetWidth);
      }
    });

    this.head.addEventListener('input', () => {
      this.dispatchEvent(new Event('input', { bubbles: true }));
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
    return this.head.zoom;
  }

  set zoom(value) {
    this.head.zoom = value;
    for (const channel of this._channels) {
      if ('zoom' in channel) {
        channel.zoom = this.zoom;
      }
    }
  }

  get position() {
    return this.head.position;
  }

  set position(value) {
    this.head.position = value;
    for (const channel of this._channels) {
      if ('position' in channel) {
        channel.position = this.position;
      }
    }
  }

  get length() {
    return this.head.length;
  }

  set length(value) {
    this.head.length = value;
    for (const channel of this._channels) {
      if ('length' in channel) {
        channel.length = this.length;
      }
    }
  }
}

if (!customElements.get('damo-timeline')) {
  customElements.define('damo-timeline', class extends TimelineInputElement { });
}
