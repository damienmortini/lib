class DamdomGalleryElement extends HTMLElement {
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
}

window.customElements.define('damdom-gallery', DamdomGalleryElement)
