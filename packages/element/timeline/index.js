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
          display: block;
          width: 300px;
        }
        damo-timeline-head {
          width: 100%;
          z-index: 1;
        }
      </style>
      <damo-timeline-head part="head"></damo-timeline-head>
      <slot></slot>
    `;

    this.head = this.shadowRoot.querySelector('damo-timeline-head');

    this._zoom = 1;
    this._slot = this.shadowRoot.querySelector('slot');

    this._channels = new Set();
    this._elementWidth = new Map();

    this._slot.addEventListener('slotchange', (event) => {
      const elements = this.querySelectorAll('*');
      this._channels.clear();
      for (const element of elements) {
        if (!('position' in element)) {
          continue;
        }
        if ('length' in element) {
          element.length = this.length;
        }
        if ('zoom' in element) {
          element.zoom = this.zoom;
        }
        this._channels.add(element);
        element.position = this.position;
        this._elementWidth.set(element, element.offsetWidth);
      }
    });

    this.addEventListener('wheel', (event) => {
      event.preventDefault();
      if (Math.abs(event.deltaX)) {
        this.position += (event.deltaX < 0 ? 1 : -1) / this.zoom;
      }
      if (Math.abs(event.deltaY)) {
        this.zoom *= event.deltaY < 0 ? 1 / .95 : .95;
      }
    });

    this.head.addEventListener('change', () => {
      for (const channel of this._channels) {
        if ('position' in channel) {
          channel.position = this.position;
        }
      }
    });

    this.head.addEventListener('scroll', () => {
      const scrollRatio = (this.head.scrollLeft / (this.head.scrollWidth - this._elementWidth.get(this.head)));
      for (const channel of this._channels) {
        channel.scrollLeft = scrollRatio * (channel.scrollWidth - this._elementWidth.get(channel));
      }
    });

    this.head.addEventListener('input', () => {
      this.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const resizeObserver = new ResizeObserver((entries) => {
      this._elementWidth.clear();
      this._elementWidth.set(this.head, this.head.offsetWidth);
      for (const channel of this._channels) {
        this._elementWidth.set(channel, channel.offsetWidth);
      }
    });
    resizeObserver.observe(this);
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

  get channels() {
    return this._channels;
  }
}

if (!customElements.get('damo-timeline')) {
  customElements.define('damo-timeline', class extends TimelineInputElement { });
}
