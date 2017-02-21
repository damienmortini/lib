import "@webcomponents/custom-elements";

import View from "../abstract/View.js";

export default class ViewElement extends HTMLElement {
  constructor({visibilityExecutor} = {}) {
    super();

    this._view = new View({
      visibilityExecutor,
      visible: false
    });
  }

  get visible() {
    return this._view.visible;
  }

  set visible(value) {
    this._view.visible = value;
  }

  get visibilityExecutor() {
    return this._view.visibilityExecutor;
  }

  set visibilityExecutor(value) {
    this._view.visibilityExecutor = value;
  }

  get visibilityPromise() {
    return this._view.visibilityPromise;
  }

  connectedCallback() {
    let element = this;
    while (element.parentNode) {
      if (element.parentNode instanceof ViewElement) {
        this._view.add(node._view);
        break;
      }
      element = element.parentNode;
    }

    this.visible = true;
  }

  disconnectedCallback() {
    this.visible = false;

    if (this._view.parent) {
      this._view.parent.remove(this);
    }
  }
}

window.customElements.define("dlib-view", ViewElement);
