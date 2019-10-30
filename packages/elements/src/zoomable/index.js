export default class ZoomableElement extends HTMLElement {
  static get observedAttributes() {
    return ['handle', 'target', 'min', 'max', 'zoom', 'disabled'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <slot></slot>
    `;

    this.target = this;
    this._handle = this;

    this._min = 0;
    this._max = Infinity;
    this._zoom = 1;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }
    switch (name) {
      case 'handle':
      case 'target':
        this[name] = new Function(`return ${newValue}`).apply(this);
        break;
      case 'disabled':
        this[name] = newValue !== null;
        break;
      default:
        this[name] = parseFloat(newValue);
        break;
    }
  }

  connectedCallback() {
    this.disabled = this.disabled;
  }

  disconnectedCallback() {
    if (this.handle) {
      this.handle.removeEventListener('wheel', this._onWheelBinded);
    }
  }

  _onWheel(event) {
    this.zoom += event.wheelDeltaY * .0004;
  }

  get handle() {
    return this._handle;
  }

  set handle(value) {
    this.disconnectedCallback();
    this._handle = value;
    this.disabled = this.disabled;
  }

  get disabled() {
    return this._disabled;
  }

  set disabled(value) {
    this._disabled = value;

    this.disconnectedCallback();

    if (!this._disabled) {
      this._handle.addEventListener('wheel', this._onWheelBinded = this._onWheelBinded || this._onWheel.bind(this));
    }
  }

  get zoom() {
    return this._zoom;
  }

  set zoom(value) {
    if (value === this._zoom) {
      return;
    }

    this._zoom = value;

    this._zoom = Math.min(this.max, Math.max(this.min, this._zoom));

    this.target.style.transform = `scale(${this._zoom})`;

    this.dispatchEvent(new Event('zoom'));
  }

  get min() {
    return this._min;
  }

  set min(value) {
    this._min = value;
    this.zoom = this.zoom;
  }

  get max() {
    return this._max;
  }

  set max(value) {
    this._max = value;
    this.zoom = this.zoom;
  }
}
