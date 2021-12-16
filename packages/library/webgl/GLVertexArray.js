export default class GLVertexArray {
  #vertexArray
  #geometry
  #program

  constructor({
    gl,
    geometry = undefined,
    program = undefined,
  }) {
    this.gl = gl

    this.#geometry = geometry
    this.#program = program

    const extension = gl.getExtension('OES_vertex_array_object')
    if (extension) {
      this.gl.createVertexArray = extension.createVertexArrayOES.bind(extension)
      this.gl.bindVertexArray = extension.bindVertexArrayOES.bind(extension)
    }

    this.#vertexArray = this.gl.createVertexArray()

    if (geometry && program) {
      this.add({
        geometry,
        program,
      })
    }
  }

  add({
    geometry = undefined,
    program = undefined,
  } = {}) {
    this.bind()
    program.attributes.set(geometry.attributes)
    if (geometry.indices) {
      geometry.indices.buffer.bind()
    }
    this.unbind()
  }

  bind() {
    this.gl.bindVertexArray(this.#vertexArray)
  }

  unbind() {
    this.gl.bindVertexArray(null)
  }
}
