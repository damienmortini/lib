import View from "../../@damienmortini/lib/abstract/View.js";

export default class ViewElement extends HTMLElement {
  constructor() {
    super();

    this._view = new View({
      visible: false,
    });
  }

  get visible() {
    return this._view.visible;
  }

  set visible(value) {
    this._view.visible = value;
  }

  get visibilityPromise() {
    return this._view.visibilityPromise;
  }

  connectedCallback() {
    let element = this;
    while (element.parentNode) {
      if (element.parentNode instanceof ViewElement) {
        element.parentNode._view.add(this._view);
        break;
      }
      element = element.parentNode;
    }

    this._view.visibilityExecutor = this.visibilityExecutor.bind(this);

    this.visible = this.getAttribute("visible") !== "false";
  }

  disconnectedCallback() {
    this.visible = false;

    if (this._view.parent) {
      this._view.parent.remove(this);
    }
  }

  visibilityExecutor(resolve, view) {
    resolve();
  }
}
