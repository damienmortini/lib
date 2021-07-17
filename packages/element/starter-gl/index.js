import AnimationTickerElement from '../../@damienmortini/element-animation-ticker/index.js'

import View from './View.js'

/**
 * Entry point element
 * @hideconstructor
 * @example
 * <damo-starter-gl></damo-starter-gl>
 */
window.customElements.define('damo-starter-gl', class extends AnimationTickerElement {
  constructor() {
    super()

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          contain: content;
          width: 300px;
          height: 150px;
        }
        
        canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
      </style>
      <canvas></canvas>
    `

    this.canvas = this.shadowRoot.querySelector('canvas')

    this.view = new View({ canvas: this.canvas })

    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width
      const height = entries[0].contentRect.height

      this.canvas.width = width * window.devicePixelRatio
      this.canvas.height = height * window.devicePixelRatio

      this.view.resize(width, height)
    })
    resizeObserver.observe(this.canvas)
  }

  update() {
    this.view.update()
  }
})
