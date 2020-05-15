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
          display: block;
          width: 300px;
        }
        damo-timeline-ticker {
          width: 100%;
          z-index: 1;
        }
        #channels {
          --zoom: 1;
          display: grid;
          gap: 2px;
          overflow: hidden;
        }
        ::slotted(*) {
          width: calc(100% * var(--zoom));
          height: 100px;
        }
      </style>
      <damo-timeline-ticker></damo-timeline-ticker>
      <div id="channels">
        <slot></slot>
      </div>
    `;

    this._zoom = 1;
    this._channelsContainer = this.shadowRoot.querySelector('#channels');
    this._timelineTicker = this.shadowRoot.querySelector('damo-timeline-ticker');

    this._channelsContainer.addEventListener('wheel', (event) => {
      event.preventDefault();
      if (event.deltaY < 0) {
        this.currentTime -= this.zoom;
      } else {
        this.currentTime += this.zoom;
      }
    });

    this._timelineTicker.addEventListener('wheel', (event) => {
      event.preventDefault();
      if (event.deltaY < 0) {
        this.zoom *= .95;
      } else {
        this.zoom /= .95;
      }
    });

    let previousTime = 0;
    const channelsPreviousValue = new Map();
    this._timelineTicker.addEventListener('timeupdate', () => {
      for (const channel of this._channels) {
        channel.currentTime = this.currentTime;
        // console.log(channel.currentTime, channel.value);

        // for (const keyframe of channel.keyframes) {
        //   if (keyframe >= previousTime && keyframe < this.currentTime) {
        //     this.dispatchEvent(new CustomEvent('input', {
        //       detail: {
        //         name: channel.name,
        //         time: keyframe,
        //         color: channel.color,
        //       },
        //     }));
        //   }
        // }
      }
      previousTime = this.currentTime;
    });

    this._timelineTicker.addEventListener('scroll', () => {
      // this._channelsContainer.scrollLeft = this._timelineTicker.scrollLeft;
      for (const channel of this._channels) {
        channel.scrollLeft = this._timelineTicker.scrollLeft;
      }
    });

    this._channels = new Set();

    const mutationCallback = (mutationsList, observer) => {
      for (const mutation of mutationsList) {
        for (const node of mutation.addedNodes) {
          if (node.currentTime !== undefined && node.value !== undefined) {
            this._channels.add(node);
            node.currentTime = this.currentTime;
            if (node.duration !== undefined) {
              node.duration = this.duration;
            }
          }
        }
        for (const node of mutation.removedNodes) {
          this._channels.delete(node);
        }
      }
      this._timelineTicker.tickHeight = this._channelsContainer.clientHeight;
    };
    mutationCallback([{
      addedNodes: this.children,
      removedNodes: [],
    }]);
    new MutationObserver(mutationCallback).observe(this, { childList: true });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'zoom':
      case 'duration':
        this[name] = Number(newValue);
        break;
    }
  }

  // addChannel({ name, key, color, keyframes, step }) {
  //   const channel = document.createElement('damo-timeline-channel');
  //   channel.name = name;
  //   channel.color = color;
  //   channel.keyframes = keyframes;
  //   channel.zoom = this.zoom;
  //   channel.step = step;
  //   window.addEventListener('keydown', (event) => {
  //     if (event.key === key) {
  //       const time = Math.floor(this.currentTime / channel.step) * channel.step;
  //       if (channel.keyframes.has(time)) {
  //         return;
  //       }
  //       channel.keyframes.add(time);
  //       channel._update();
  //       this.dispatchEvent(new CustomEvent('input', {
  //         detail: {
  //           name: channel.name,
  //           time: time,
  //           color: channel.color,
  //         },
  //       }));
  //     }
  //   });
  //   this._channels.add(channel);
  //   this._channelsContainer.appendChild(channel);
  //   this._timelineTicker.tickHeight = this._channelsContainer.clientHeight;
  // }

  get zoom() {
    return this._zoom;
  }

  set zoom(value) {
    this._zoom = Math.max(value, 1);
    this._timelineTicker.zoom = this._zoom;
    // this._channelsContainer.style.setProperty('--zoom', this._zoom);
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
