window.customElements.define('damdom-elementgallery', class extends HTMLElement {
  constructor() {
    super()

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
        }
      </style>
      <slot></slot>
    `
  }
})
