import Ticker from '../../../lib/src/util/Ticker.js';
import Pointer from '../../../lib/src/input/Pointer.js';

const POINTER = Pointer.get();

export default class LinkElement extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          position: absolute;
          top: 0;
          left: 0;
          pointer-events: none;
        }
        svg {
          position: absolute;
          width: 100%;
          height: 100%;
        }
        #scale-marker {
          position: absolute;
          visibility: hidden;
          width: 1px;
          height: 1px;
        }
        path {
          fill: transparent;
          stroke: black;
          stroke-width: 1px;
          stroke-linecap: round;
        }
        path.hit-test {
          stroke: transparent;
          stroke-width: 20px;
          pointer-events: auto;
          cursor: pointer;
        }
        path.hit-test.hidden {
          visibility: hidden;
        }
        svg:hover path.main {
          stroke: red;
        }
      </style>
      <div id="scale-marker"></div>
      <slot>
        <svg>
          <path class="hit-test hidden"></path>
          <path class="main"></path>
        </svg>
      </slot>
    `;

    this._svg = this.shadowRoot.querySelector('svg');
    this._path = this.shadowRoot.querySelector('path.main');
    this._hitTestPath = this.shadowRoot.querySelector('path.hit-test');
    this._scaleMarker = this.shadowRoot.querySelector('#scale-marker');

    this._updateBinded = this._update.bind(this);

    this.input = null;
    this.output = null;
  }

  connectedCallback() {
    Ticker.add(this._updateBinded);
  }

  disconnectedCallback() {
    Ticker.delete(this._updateBinded);
  }

  get input() {
    return this._input;
  }

  set input(value) {
    this._input = value;
    this.linked = !!this.input && !!this.output;
  }

  get output() {
    return this._output;
  }

  set output(value) {
    this._output = value;
    this.linked = !!this.input && !!this.output;
  }

  _update() {
    const rootBoundingRect = this.getBoundingClientRect();
    const scaleMarkerBoundingRect = this._scaleMarker.getBoundingClientRect();

    const pointerX = (POINTER.x - rootBoundingRect.x) / scaleMarkerBoundingRect.width;
    const pointerY = (POINTER.y - rootBoundingRect.y) / scaleMarkerBoundingRect.height;

    let inputX = pointerX;
    let inputY = pointerY;
    if (this.input) {
      let inBoundingRect;
      let input = this.input;
      do {
        if (!input) {
          this.remove();
          return;
        }
        inBoundingRect = input.getBoundingClientRect();
        input = input.parentElement;
      } while (inBoundingRect.x + inBoundingRect.y + inBoundingRect.width + inBoundingRect.height === 0);
      inputX = (inBoundingRect.x + inBoundingRect.width * .5 - rootBoundingRect.x) / scaleMarkerBoundingRect.width;
      inputY = (inBoundingRect.y + inBoundingRect.height * .5 - rootBoundingRect.y) / scaleMarkerBoundingRect.height;
    }

    let outputX = pointerX;
    let outputY = pointerY;
    if (this.output) {
      let outBoundingRect;
      let output = this.output;
      do {
        if (!output) {
          this.remove();
          return;
        }
        outBoundingRect = output.getBoundingClientRect();
        output = output.parentElement;
      } while (outBoundingRect.x + outBoundingRect.y + outBoundingRect.width + outBoundingRect.height === 0);
      outputX = (outBoundingRect.x - rootBoundingRect.x + outBoundingRect.width * .5) / scaleMarkerBoundingRect.width;
      outputY = (outBoundingRect.y + outBoundingRect.height * .5 - rootBoundingRect.y) / scaleMarkerBoundingRect.height;
    }

    this._draw(inputX, inputY, outputX, outputY);
  }

  _draw(inputX, inputY, outputX, outputY) {
    const padding = 10;

    this._svg.style.transform = `translate(${Math.min(inputX, outputX) - padding}px, ${Math.min(inputY, outputY) - padding}px)`;
    this._svg.style.width = `${Math.abs(inputX - outputX) + padding * 2}px`;
    this._svg.style.height = `${Math.abs(inputY - outputY) + padding * 2}px`;

    if (outputX > inputX) {
      outputX = outputX - inputX;
      inputX = 0;
    } else {
      inputX = inputX - outputX;
      outputX = 0;
    }

    if (outputY > inputY) {
      outputY = outputY - inputY;
      inputY = 0;
    } else {
      inputY = inputY - outputY;
      outputY = 0;
    }

    this._path.setAttribute('d', `M${inputX + padding} ${inputY + padding} L ${outputX + padding} ${outputY + padding}`);
    this._hitTestPath.setAttribute('d', `M${inputX + padding} ${inputY + padding} L ${outputX + padding} ${outputY + padding}`);
    // this._path.setAttribute('d', `M${inputX + padding} ${inputY + padding} C ${inputX + (outputX - inputX) * .5} ${inputY}, ${outputX + (inputX - outputX) * .5} ${outputY}, ${outputX + padding} ${outputY + padding}`);
    // this._hitTestPath.setAttribute('d', `M${inputX + padding} ${inputY + padding} C ${inputX + (outputX - inputX) * .5} ${inputY}, ${outputX + (inputX - outputX) * .5} ${outputY}, ${outputX + padding} ${outputY + padding}`);
  }

  get linked() {
    return this._linked;
  }

  set linked(value) {
    if (this._linked === value) {
      return;
    }
    this._linked = value;
    this._hitTestPath.classList.toggle('hidden', !this._linked);
  }
}
