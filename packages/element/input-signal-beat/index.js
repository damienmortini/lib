export default class BeatSignalInputElement extends HTMLElement {
  static get observedAttributes() {
    return ['beats', 'length', 'looplength', 'step', 'zoom'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          height: 20px;
          width: 300px;
          background: lightgrey;
          overflow-y: hidden;
          overflow-x: overlay;
          contain: strict;
          color: white;
          touch-action: none;
          user-select: none;
        }
        :host::-webkit-scrollbar {
          background: transparent;
          height: 2px;
        }
        :host::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, .2);
        }
        #beats {
          pointer-events: none;
          position: relative;
          overflow: hidden;
          width: 100%;
          height: 100%;
          contain: strict;
        }
        .beat {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
          width: 10px;
          height: 10px;
          background: currentColor;
          border: 1px solid black;
        }
        #head {
          position: absolute;
          will-change: transform;
          height: 100%;
          top: 0;
          left: 0;
          border-left: 1px solid red;
        }
      </style>
      <div id="head"></div>
      <div id="beats"></div>
    `;

    this._head = this.shadowRoot.querySelector('#head');

    this._beatsContainer = this.shadowRoot.querySelector('#beats');

    this.color = 'white';

    this._value = NaN;
    this._step = 1;
    this._length = 1;
    this._position = 0;
    this._decimals = 0;
    this.loopLength = 0;

    this._beatElements = new Map();

    const self = this;
    class Beats extends Set {
      _add(value) {
        value = self._roundValueOnStep(value);
        if (this.has(value)) {
          return;
        }
        super.add(value);
        const element = document.createElement('div');
        element.id = value;
        element.classList.add('beat');
        self._setElementTransformFromBeat(element, value);
        self._beatsContainer.appendChild(element);
        self._beatElements.set(value, element);
      }
      add(value) {
        if (self.loopLength) {
          let position = 0;
          while (position < self.length - self.loopLength) {
            this._add(position + (value % self.loopLength));
            position += self.loopLength;
          }
        } else {
          this._add(value);
        }
        return this;
      }
      _delete(value) {
        value = self._roundValueOnStep(value);
        const hasElement = super.delete(value);
        if (!hasElement) {
          return hasElement;
        }
        const element = self._beatElements.get(value);
        element.remove();
        self._beatElements.delete(value);
        return hasElement;
      }
      delete(value) {
        let somethingRemoved = false;
        if (self.loopLength) {
          let position = 0;
          while (position < self.length - self.loopLength) {
            somethingRemoved = this._delete(position + (value % self.loopLength)) || somethingRemoved;
            position += self.loopLength;
          }
        } else {
          somethingRemoved = this._delete(value);
        }
        return somethingRemoved;
      }
      clear() {
        for (const value of this) {
          this.delete(value);
        }
      }
    };
    this._beats = new Beats();

    let previousbeat = null;
    let mode = '';
    const preventContextMenu = (event) => event.preventDefault();
    const pointerDown = (event) => {
      this.setPointerCapture(event.pointerId);
      this.addEventListener('pointermove', pointerMove);
      this.addEventListener('pointerup', pointerUp);
      this.addEventListener('pointerout', pointerUp);
      window.addEventListener('contextmenu', preventContextMenu);
      pointerMove(event);
    };
    const pointerMove = (event) => {
      const newbeat = ((event.offsetX + this.scrollLeft) / this.scrollWidth) * this.length;
      previousbeat = previousbeat !== null ? previousbeat : newbeat;
      const startBeat = newbeat > previousbeat ? previousbeat : newbeat;
      const endBeat = newbeat > previousbeat ? newbeat : previousbeat;
      if (event.buttons === 1) {
        if (this.step) {
          for (let beat = startBeat; beat <= endBeat; beat += this.step) {
            beat = this._roundValueOnStep(beat);
            if ((!mode && this.beats.has(beat)) || mode === 'delete') {
              mode = 'delete';
              this.beats.delete(beat);
            } else if (!mode || mode === 'add') {
              mode = 'add';
              this.beats.add(beat);
            }
          }
        } else {
          this.beats.add(newbeat);
        }
      } else {
        for (const beat of this.beats) {
          if (beat >= startBeat && beat <= endBeat) {
            this.beats.delete(beat);
          }
        }
      }
      previousbeat = newbeat;
      this.dispatchEvent(new Event('input'));
    };
    const pointerUp = (event) => {
      mode = '';
      previousbeat = null;
      this.releasePointerCapture(event.pointerId);
      this.removeEventListener('pointermove', pointerMove);
      this.removeEventListener('pointerup', pointerUp);
      this.removeEventListener('pointerout', pointerUp);
      requestAnimationFrame(() => {
        window.removeEventListener('contextmenu', preventContextMenu);
      });
    };
    this.addEventListener('pointerdown', pointerDown);

    const resizeObserver = new ResizeObserver((entries) => {
      this._width = entries[0].contentRect.width;
    });
    resizeObserver.observe(this);
  }

  _setElementTransformFromBeat(element, beat) {
    element.style.left = `${beat / this.length * 100}%`;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'beats':
        const newBeats = new Function(`return ${newValue}`)();
        this.beats.clear();
        for (const beat of newBeats) {
          this.beats.add(beat);
        }
        break;
      case 'looplength':
        this.loopLength = Number(newValue);
        break;
      case 'length':
      case 'zoom':
      case 'step':
        this[name] = Number(newValue);
        break;
    }
  }

  _roundValueOnStep(value) {
    if (!this.step) {
      return value;
    }
    value = Math.round(value / this.step) * this.step;
    value = Number(value.toFixed(this._decimals));
    return value;
  }

  get beats() {
    return this._beats;
  }

  get zoom() {
    return this._zoom;
  }

  set zoom(value) {
    value = Math.max(value, 1);
    this._zoom = value;
    this._beatsContainer.style.width = `${this._zoom * 100}%`;
  }

  get step() {
    return this._step;
  }

  set step(value) {
    this._step = value;
    this._decimals = this.step % 1 ? String(this.step).split('.')[1].length : 0;
  }

  get length() {
    return this._length;
  }

  set length(value) {
    this._length = value;
    for (const [beat, element] of this._beatElements) {
      this._setElementTransformFromBeat(element, beat);
    }
  }

  get position() {
    return this._position;
  }

  set position(value) {
    if (value === this._position) {
      return;
    }
    const backward = value < this._position;
    const start = backward ? value : this._position;
    const end = backward ? this._position : value;
    let changed = false;
    let maxBeat = -Infinity;
    let minBeat = Infinity;
    for (const beat of this.beats) {
      if (beat >= start && beat <= end) {
        changed = true;
        maxBeat = Math.max(maxBeat, beat);
        minBeat = Math.min(minBeat, beat);
      }
    }
    this._position = value;
    this._head.style.transform = `translateX(${this._position / this.length * this._width * this.zoom}px)`;
    if (changed) {
      this._value = backward ? minBeat : maxBeat;
      this.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  get value() {
    return this._value;
  }
}

if (!customElements.get('damo-input-signal-beat')) {
  customElements.define('damo-input-signal-beat', class extends BeatSignalInputElement { });
}
