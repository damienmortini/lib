import GLPlaneObject from '@damienmortini/webgl/object/GLPlaneObject.js'
import GLProgram from '@damienmortini/webgl/GLProgram.js'

export default class DamdomGLSLCanvasElement extends HTMLElement {
  #gl

  constructor() {
    super()

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
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

    this.#gl = this.canvas.getContext('webgl2')

    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width * window.devicePixelRatio
      const height = entries[0].contentRect.height * window.devicePixelRatio

      this.canvas.width = width
      this.canvas.height = height

      this.#gl.viewport(0, 0, width, height)
      this.uniforms.set('resolution', [width, height])
      this.draw()
    })
    resizeObserver.observe(this.canvas)

    this.object = new GLPlaneObject({
      gl: this.#gl,
      width: 2,
      height: 2,
      program: new GLProgram({
        gl: this.#gl,
        uniforms: {
          resolution: [this.canvas.width, this.canvas.height],
        },
        vertex: `#version 300 es
in vec3 position;
void main() {
  gl_Position = vec4(position, 1.);
}`,
        fragment: `#version 300 es
precision highp float;

uniform vec2 resolution;
out vec4 fragColor;

void main() {
  fragColor = vec4(gl_FragCoord.xy / resolution, 0., 1.);
}`,
      }),
    })
  }

  connectedCallback() {
    if (this.hasAttribute('fragment')) this.fragment = this.getAttribute('fragment')
  }

  get fragment() {
    return this.object.program.fragment
  }

  set fragment(value) {
    this.object.program.fragment = value
    this.draw()
  }

  get uniforms() {
    return this.object.program.uniforms
  }

  get gl() {
    return this.#gl
  }

  draw(options) {
    this.#gl.clear(this.#gl.COLOR_BUFFER_BIT)
    this.object.draw({ bind: true, ...options })
  }
}

customElements.define('damdom-glslcanvas', DamdomGLSLCanvasElement)
