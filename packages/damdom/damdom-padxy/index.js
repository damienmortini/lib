export default class DamdomPadXYElement extends HTMLElement {
  #value = [0, 0];
  #pad;
  #pointer;
  #width = 100;
  #height = 100;
  #min = [-1, -1];
  #max = [1, 1];

  static get observedAttributes() {
    return ['value', 'disabled', 'min', 'max'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: inline-block;
          position: relative;
          width: 100px;
          height: 100px;
          touch-action: none;
          background: white;
          overflow: hidden;
          contain: content;
        }

        :host([disabled]) {
          opacity: .5;
        }

        #pad {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          cursor: crosshair;
          background-size: 10% 10%, 10% 10%, 50% 50%, 50% 50%;
          background-image: linear-gradient(to right, grey 0px, transparent 1px), linear-gradient(to bottom, grey 0px, transparent 1px), linear-gradient(to right, black 0px, transparent 1px), linear-gradient(to bottom, black 0px, transparent 1px);
          background-position: -.5px -.5px;
          touch-action: none;
        }
        #pointer {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 4px;
          height: 4px;
          background: black;
          border-radius: 50%;
          margin-left: -2px;
          margin-top: -2px;
          will-change: transform;
          pointer-events: none;
        }
      </style>
      <div id="pad"></div>
      <div id="pointer"></div>
    `;

    this.#pad = this.shadowRoot.querySelector('#pad');
    this.#pointer = this.shadowRoot.querySelector('#pointer');

    const resizeObserver = new ResizeObserver((entries) => {
      this.#width = entries[0].contentRect.width;
      this.#height = entries[0].contentRect.height;

      this.#updatePointer();
    });
    resizeObserver.observe(this);

    const pointerDownPosition = [0, 0];
    const pointerDownScreenPosition = [0, 0];

    const updatePointer = (event) => {
      event.preventDefault();
      let x = ((pointerDownPosition[0] + event.screenX - pointerDownScreenPosition[0]) / this.#pad.offsetWidth);
      let y = 1 - ((pointerDownPosition[1] + event.screenY - pointerDownScreenPosition[1]) / this.#pad.offsetHeight);
      x = Math.max(Math.min(1, x), 0);
      y = Math.max(Math.min(1, y), 0);
      this.value = [this.#min[0] + x * (this.#max[0] - this.#min[0]), this.#min[1] + y * (this.#max[1] - this.#min[1])];
    };

    const onPointerUp = (event) => {
      updatePointer(event);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointermove', updatePointer);
    };

    this.#pad.addEventListener('pointerdown', (event) => {
      pointerDownPosition[0] = event.offsetX;
      pointerDownPosition[1] = event.offsetY;
      pointerDownScreenPosition[0] = event.screenX;
      pointerDownScreenPosition[1] = event.screenY;
      window.addEventListener('pointermove', updatePointer);
      window.addEventListener('pointerup', onPointerUp);
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'value':
        this.value = new Function(`return ${newValue}`).apply(this);
        break;
      case 'min':
        this.#min = JSON.parse(newValue);
        break;
      case 'max':
        this.#max = JSON.parse(newValue);
        break;
    }
  }

  #updatePointer() {
    const x = (this.#value[0] - this.#min[0]) / (this.#max[0] - this.#min[0]);
    const y = (this.#value[1] - this.#min[1]) / (this.#max[1] - this.#min[1]);
    this.#pointer.style.transform = `translate(${x * this.#width - this.#width * 0.5}px, ${-(y * this.#height - this.#height * 0.5)}px)`;
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(value) {
    if (value) {
      this.setAttribute('disabled', '');
    }
    else {
      this.removeAttribute('disabled');
    }
  }

  get min() {
    return this.getAttribute('min');
  }

  set min(value) {
    this.setAttribute('min', JSON.stringify(value));
  }

  get max() {
    return this.getAttribute('max');
  }

  set max(value) {
    this.setAttribute('max', JSON.stringify(value));
  }

  get value() {
    return this.#value;
  }

  set value(value) {
    if (this.#value[0] === value[0] && this.#value[1] === value[1]) {
      return;
    }
    this.#value = value;
    this.#updatePointer();
    this.dispatchEvent(new Event('input', {
      bubbles: true,
    }));
    this.dispatchEvent(new Event('change', {
      bubbles: true,
    }));
  }
}

customElements.define('damdom-padxy', DamdomPadXYElement);
