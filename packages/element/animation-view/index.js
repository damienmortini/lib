import View from '../core/abstract/View.js';

export default class ViewAnimationElement extends HTMLElement {
  static get observedAttributes() {
    return ['hidden'];
  }

  constructor() {
    super();

    this._view = new View();

    this._view.onShow = this.onshow.bind(this);
    this._view.onHide = this.onhide.bind(this);
  }

  async onshow() { }

  async onhide() { }

  async show() {
    this.hidden = false;
    return this._view.show();
  }

  async hide() {
    this.hidden = true;
    return this._view.hide();
  }

  get isHidden() {
    return this._view.isHidden;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }
    switch (name) {
      case 'hidden':
        if (this.hasAttribute('hidden')) {
          this.hide();
        } else {
          this.show();
        }
        break;
    }
  }

  _getParentViewAnimationElement() {
    let element = this;
    let parentNode;
    while (parentNode = element instanceof ShadowRoot ? element.host : element.parentNode) {
      if (parentNode instanceof ViewAnimationElement) {
        return parentNode;
      }
      element = parentNode;
    }
    return null;
  }

  connectedCallback() {
    const parentViewAnimationElement = this._getParentViewAnimationElement();
    if (parentViewAnimationElement) {
      this._getParentViewAnimationElement()._view.add(this._view);
    }
  }

  disconnectedCallback() {
    if (!this._getParentViewAnimationElement() && this._view.parent) {
      this._view.parent.remove(this._view);
    }
  }
}

if (!customElements.get('damo-animation-view')) {
  customElements.define('damo-animation-view', class DamoViewAnimationElement extends ViewAnimationElement { });
}
