import { modulo } from '../core/math/Math.js';

export default class KnobInputElement extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'max', 'min', 'step', 'disabled'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `<style>
  :host {
    display: inline-block;
    position: relative;
    width: 100px;
    height: 100px;
  }
  
  slot[name=track], slot[name=track-progress] {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  slot[name=thumb] {
    position: absolute;
    top: 50%;
    left: 50%;
    display: block;
  }

  svg {
    pointer-events: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    stroke: currentColor;
  }

  slot[name=thumb] div {
    pointer-events: none;
    width: 10px;
    height: 10px;
    transform: translate(-50%, -50%);
    background: currentColor;
    border-radius: 100%;
  }
</style>
<slot name="track">
  <svg viewBox="0 0 100 100" overflow="visible">
    <circle part="track" cx="50" cy="50" r="50" fill="transparent" stroke-width="1" stroke-linecap="round" vector-effect="non-scaling-stroke" stroke-dasharray="0 2"/>
  </svg>
</slot>
<slot name="track-progress">
  <svg viewBox="0 0 100 100" overflow="visible">
    <path part="track-progress" d="M 50 0 A 50 50 0 1 1 0 50" fill="transparent" vector-effect="non-scaling-stroke" stroke-width="1" />
  </svg>
</slot>
<slot name="thumb">
  <div></div>
</slot>`;

    this._value = 0;
    this._size = 1;
    this._thumb = this.shadowRoot.querySelector('slot[name=thumb]');
    this._trackProgressPath = this.shadowRoot.querySelector('slot[name=track-progress] path');

    let boundingClientRect;
    let previousAngle = 0;
    const getAngleFromPointerEvent = (event) => {
      const x = event.clientX - boundingClientRect.x - boundingClientRect.width * .5;
      const y = event.clientY - boundingClientRect.y - boundingClientRect.height * .5;
      return Math.atan2(-x, y) + Math.PI;
    };
    const pointerDown = (event) => {
      boundingClientRect = this.getBoundingClientRect();
      this.setPointerCapture(event.pointerId);
      this.addEventListener('pointermove', pointerMove);
      this.addEventListener('pointerup', pointerUp);
      this.addEventListener('pointerout', pointerUp);
      previousAngle = this.value;
    };
    const pointerMove = (event) => {
      const angle = getAngleFromPointerEvent(event);
      let angleDifference = angle - previousAngle;
      if (angleDifference > Math.PI) {
        angleDifference -= Math.PI * 2;
      }
      if (angleDifference < -Math.PI) {
        angleDifference += Math.PI * 2;
      }
      this.value += angleDifference;
      previousAngle = angle;
    };
    const pointerUp = (event) => {
      this.releasePointerCapture(event.pointerId);
      this.removeEventListener('pointermove', pointerMove);
      this.removeEventListener('pointerup', pointerUp);
      this.removeEventListener('pointerout', pointerUp);
    };
    this.addEventListener('pointerdown', pointerDown);

    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      const height = entries[0].contentRect.height;
      this._size = width < height ? width : height;
      this._update();
    });
    resizeObserver.observe(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'value':
        this.value = Number(newValue);
        break;
      case 'max':
      case 'min':
      case 'step':
        // TODO
        break;
      case 'disabled':
        // TODO
        break;
    }
  }

  _update() {
    const x = Math.sin(this.value);
    const y = -Math.cos(this.value);
    this._thumb.style.transform = `translate(${x * this._size * .5}px, ${y * this._size * .5}px)`;
    this._trackProgressPath.setAttribute('d', `M 50 0 A 50 50 0 ${(modulo(this.value, Math.PI * 2)) > Math.PI ? 1 : 0} 1 ${x * 50 + 50} ${y * 50 + 50}`);
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(value) {
    if (value) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  get max() {
    return Number(this.getAttribute('max'));
  }

  set max(value) {
    this.setAttribute('max', String(value));
  }

  get min() {
    return Number(this.getAttribute('min'));
  }

  set min(value) {
    this.setAttribute('min', String(value));
  }

  get step() {
    return Number(this.getAttribute('step'));
  }

  set step(value) {
    this.setAttribute('step', String(value));
  }

  get value() {
    return this._value;
  }

  set value(value) {
    if (value === this._value) {
      return;
    }
    this._value = value;
    this._update();
    this.dispatchEvent(new Event('change', {
      bubbles: true,
    }));
  }
}

customElements.define('damo-input-knob', KnobInputElement);
