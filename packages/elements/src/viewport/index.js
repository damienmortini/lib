export default class ViewportElement extends HTMLElement {
  static get observedAttributes() {
    return ['draggable', 'zoomable'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
        }
      </style>
      <graph-zoomable handle="this.getRootNode().host" min=".1" max="3">
        <graph-draggable handle="this.getRootNode().host">
            <slot></slot>
        </graph-draggable>
      </graph-zoomable>
    `;

    this._zoomable = this.shadowRoot.querySelector('graph-zoomable');
    this._draggable = this.shadowRoot.querySelector('graph-draggable');

    this._zoomable.addEventListener('zoom', () => {
      this._draggable.dragFactor = 1 / this._zoomable.zoom;
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'draggable':
        this._draggable.disabled = !newValue;
        break;
      case 'zoomable':
        this._zoomable.disabled = !newValue;
        break;
    }
  }

  get zoomable() {
    return this.hasAttribute('zoomable');
  }

  set zoomable(value) {
    if (value) {
      this.setAttribute('zoomable', '');
    } else {
      this.removeAttribute('zoomable');
    }
  }

  get draggable() {
    return this.hasAttribute('draggable');
  }

  set draggable(value) {
    if (value) {
      this.setAttribute('draggable', '');
    } else {
      this.removeAttribute('draggable');
    }
  }
}
