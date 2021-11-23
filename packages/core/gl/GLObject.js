import GLVertexArray from './GLVertexArray.js'
import GLTexture from './GLTexture.js'

export default class GLObject {
  #boundTextures = new Set()
  #vertexArrays = new Map()
  #program

  constructor({
    gl,
    geometry = undefined,
    program = undefined,
  }) {
    this.gl = gl

    this.geometry = geometry
    this.program = program
  }

  get program() {
    return this.#program
  }

  set program(value) {
    this.#program = value
    const programsMap = this.#vertexArrays.get(this.geometry)
    if (!programsMap.get(this.#program)) {
      programsMap.set(this.#program, new GLVertexArray({
        gl: this.gl,
        geometry: this.geometry,
        program: this.program,
      }))
    }
  }

  get geometry() {
    return this._geometry
  }

  set geometry(value) {
    this._geometry = value
    if (!this.#vertexArrays.has(this.geometry)) {
      this.#vertexArrays.set(this.geometry, new Map())
    }
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
          value.bind({
            unit: this.program.textureUnits.get(name),
          })
          this.#boundTextures.add(value)
        }
      }
    }
  }

  draw({
    mode = this.gl.TRIANGLES,
    bind = false,
    uniforms = {},
    instanceCount = undefined,
    ...options
  } = {}) {
    if (bind) {
      this.bind()
    }
    for (const [key, value] of Object.entries(uniforms)) {
      this.program.uniforms.set(key, value)
    }
    this.geometry.draw({ mode, instanceCount, ...options })
    if (bind) {
      this.unbind()
    }
  }

  unbind() {
    this.vertexArray.unbind()
    for (const texture of this.#boundTextures) {
      texture.unbind()
      this.#boundTextures.delete(texture)
    }
  }
}
