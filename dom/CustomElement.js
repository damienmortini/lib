import "webcomponents.js";

export default class CustomElement extends HTMLElement {
  createdCallback() {
    if(this.template) {
      let templateClone = document.importNode(this.template.content, true);
      this.createShadowRoot().appendChild(templateClone);
    }
  }

  attachedCallback() {}

  detachedCallback() {}

  attributeChangedCallback(attr, oldVal, newVal) {}

  static register(name, template) {
    document.registerElement(name, {
      prototype: Object.create(this.prototype, {
        template: {
          value: template,
          enumerable: true
        }
      })
    });
  }
}
