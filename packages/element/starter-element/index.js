/**
 * Entry point element
 * @hideconstructor
 * @example
 * <damo-starter-element></damo-starter-element>
 */
window.customElements.define('damo-starter-element', class extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
        }
      </style>
      <h1>damo-starter-element</h1>
    `;
  }
});
