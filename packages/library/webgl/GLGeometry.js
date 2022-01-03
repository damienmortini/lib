import GLVertexAttribute from './GLVertexAttribute.js'

export default class GLGeometry {
  #drawElementsInstanced
  #drawArraysInstanced

  constructor({
    gl,
    positions = null,
    normals = null,
    uvs = null,
    attributes = {},
    indices = null,
  }) {
    this.gl = gl
    this.indices = null

    this.gl.getExtension('OES_element_index_uint')

    this.#drawElementsInstanced = () => { }
    this.#drawArraysInstanced = () => { }
    const instancedArraysExtension = this.gl.getExtension('ANGLE_instanced_arrays')
    if (instancedArraysExtension) {
      this.#drawElementsInstanced = instancedArraysExtension.drawElementsInstancedANGLE.bind(instancedArraysExtension)
      this.#drawArraysInstanced = instancedArraysExtension.drawArraysInstancedANGLE.bind(instancedArraysExtension)
    } else if (this.gl.drawElementsInstanced) {
      this.#drawElementsInstanced = this.gl.drawElementsInstanced.bind(this.gl)
      this.#drawArraysInstanced = this.gl.drawArraysInstanced.bind(this.gl)
    }

    this.attributes = new Map(attributes instanceof Map ? attributes : Object.entries(attributes))

    if (positions) {
      this.attributes.set('position', new GLVertexAttribute({
        gl,
        data: positions,
        size: 3,
      }))
    }

    if (normals) {
      this.attributes.set('normal', new GLVertexAttribute({
        gl,
        data: normals,
        size: 3,
      }))
    }

    if (uvs) {
      this.attributes.set('uv', new GLVertexAttribute({
        gl,
        data: uvs,
        size: 2,
      }))
    }

    for (const [key, value] of this.attributes) {
      if (!(value instanceof GLVertexAttribute)) {
        this.attributes.set(key, new GLVertexAttribute({ gl, ...value }))
      }
    }

    if (indices) {
      this.indices = new GLVertexAttribute({
        gl: this.gl,
        target: this.gl.ELEMENT_ARRAY_BUFFER,
        ...(indices.length !== undefined ? { data: indices } : indices),
      })
    }
  }

  draw({
    mode = this.gl.TRIANGLES,
    elements = !!this.indices,
    count = elements ? this.indices.count : this.attributes.get('position').count,
    offset = this.indices ? this.indices.byteOffset : 0,
    type = elements ? this.indices.componentType : null,
    first = 0,
    instanceCount = undefined,
  } = {}) {
    if (elements) {
      if (instanceCount !== undefined) {
        this.#drawElementsInstanced(mode, count, type, offset, instanceCount)
      } else {
        this.gl.drawElements(mode, count, type, offset)
      }
    } else {
      if (instanceCount !== undefined) {
        this.#drawArraysInstanced(mode, first, count, instanceCount)
      } else {
        this.gl.drawArrays(mode, first, count)
      }
    }
  }
}
