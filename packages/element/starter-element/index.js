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
          display: grid;
          position: relative;
          contain: content;
          justify-content: center;
          align-items: center;
        }
        
        h1 {
          font-size: 32px;
        }
      </style>
      <h1>damo-starter-element</h1>
    `;
  }
});
