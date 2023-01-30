import { GLVertexArray } from './GLVertexArray.js'
import { GLTexture } from './GLTexture.js'

export class GLObject {
  #boundTextures = new Set()
  #vertexArrays = new Map()
  #program
  #geometry

  constructor({ gl, geometry = undefined, program = undefined }) {
    this.gl = gl

    this.geometry = geometry
    this.program = program
  }

  #updateVAO() {
    if (!this.program || !this.geometry) return
    let programsMap = this.#vertexArrays.get(this.geometry)
    if (!programsMap) {
      programsMap = new Map()
      this.#vertexArrays.set(this.geometry, programsMap)
    }
    if (!programsMap.get(this.#program)) {
      programsMap.set(
        this.#program,
        new GLVertexArray({
          gl: this.gl,
          geometry: this.geometry,
          program: this.program,
        }),
      )
    }
  }

  get program() {
    return this.#program
  }

  set program(value) {
    this.#program = value
    this.#updateVAO()
  }

  get geometry() {
    return this.#geometry
  }

  set geometry(value) {
    this.#geometry = value
    this.#updateVAO()
  }

  get vertexArray() {
    return this.#vertexArrays.get(this.geometry).get(this.program)
  }

  bind() {
    this.program.use()
    this.vertexArray.bind()
    for (const [name, { type }] of this.program.uniformData) {
      if (type.startsWith('sampler')) {
        const value = this.program.uniforms.get(name)
        if (value instanceof GLTexture) {
          value.bind({ unit: this.program.textureUnits.get(name) })
          this.#boundTextures.add(value)
        }
      }
    }
  }

  draw({ mode = this.gl.TRIANGLES, bind = false, uniforms = {}, instanceCount = undefined, ...options } = {}) {
    if (bind) this.bind()
    for (const [key, value] of Object.entries(uniforms)) {
      if (value instanceof GLTexture && !this.#boundTextures.has(value)) {
        value.bind({ unit: this.program.textureUnits.get(key) })
        this.#boundTextures.add(value)
      }
      this.program.uniforms.set(key, value)
    }
    this.geometry.draw({ mode, instanceCount, ...options })
    if (bind) this.unbind()
  }

  unbind() {
    this.vertexArray.unbind()
    for (const texture of this.#boundTextures) {
      texture.unbind()
      this.#boundTextures.delete(texture)
    }
  }
}
