import DamdomTickerElement from '@damienmortini/damdom-ticker/index.js'

import View from './View.js'

class DemoWebGLElement extends DamdomTickerElement {
  #canvas
  #view

  constructor() {
    super()

    this.callback = this.#update

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          contain: content;
          width: 500px;
          height: 500px;
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

    this.#canvas = this.shadowRoot.querySelector('canvas')

    this. #view = new View({ canvas: this.#canvas })

    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width
      const height = entries[0].contentRect.height

      this.#canvas.width = width * devicePixelRatio
      this.#canvas.height = height * devicePixelRatio

      this.#view.resize(width, height)
    })
    resizeObserver.observe(this.#canvas)
  }

  #update = () => {
    this.#view.update()
  }
}

customElements.define('demo-webgl', DemoWebGLElement)
