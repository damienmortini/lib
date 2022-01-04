import GLPlaneObject from '@damienmortini/webgl/object/GLPlaneObject.js'
import GLProgram from '@damienmortini/webgl/GLProgram.js'
import { FRAGMENT, addChunks } from '@damienmortini/webgl/GLSLShader.js'

export default class DamdomGLSLCanvasElement extends HTMLElement {
  #fragmentChunks
  #gl

  constructor() {
    super()

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          touch-action: none;
        }
        
        canvas {
          width: 100%;
          height: 100%;
          max-height: 100%;
        }
      </style>
      <canvas></canvas>
    `

    this.canvas = this.shadowRoot.querySelector('canvas')

    this.#gl = this.canvas.getContext('webgl2')
    if (!this.#gl) {
      this.#gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl')
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width
      const height = entries[0].contentRect.height

      this.canvas.width = width * window.devicePixelRatio
      this.canvas.height = height * window.devicePixelRatio

      this.#gl.viewport(0, 0, this.canvas.width, this.canvas.height)
      this.uniforms.set('glslCanvasSize', [width, height])
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
          glslCanvasSize: [this.canvas.width, this.canvas.height],
        },
        vertex: `#version 300 es
in vec3 position;
out vec2 uv;
void main() {
  gl_Position = vec4(position, 1.);
  uv = position.xy * .5 + .5;
}`,
        fragment: FRAGMENT,
      }),
    })
  }

  get fragmentChunks() {
    return this.#fragmentChunks
  }

  set fragmentChunks(value) {
    this.#fragmentChunks = value
    this.object.program.fragment = addChunks(FRAGMENT, this.#fragmentChunks)
    this.draw()
  }

  get uniforms() {
    return this.object.program.uniforms
  }

  draw(options) {
    this.#gl.clear(this.#gl.COLOR_BUFFER_BIT)
    console.log(this.object.program)
    this.object.draw({ bind: true, ...options })
  }
}

customElements.define('damdom-glslcanvas', DamdomGLSLCanvasElement)
