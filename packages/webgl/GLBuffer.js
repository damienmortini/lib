export class GLBuffer {
  #buffer
  #data

  constructor({ gl, data = null, target = gl.ARRAY_BUFFER, usage = gl.STATIC_DRAW }) {
    this.gl = gl
    this.target = target
    this.usage = usage

    this.#buffer = this.gl.createBuffer()

    if (data) {
      this.data = data
    }
  }

  set data(value) {
    this.#data = value
    this.bind()
    this.gl.bufferData(this.target, this.#data, this.usage)
    this.unbind()
  }

  get data() {
    return this.#data
  }

  bind({ target = this.target, index = undefined, offset = 0, size = undefined } = {}) {
    if (index === undefined) {
      this.gl.bindBuffer(target, this.#buffer)
    } else if (size === undefined) {
      this.gl.bindBufferBase(target, index, this.#buffer)
    } else {
      this.gl.bindBufferRange(target, index, this.#buffer, offset, size)
    }
  }

  unbind({ target = this.target, index = undefined, offset = 0, size = undefined } = {}) {
    if (index === undefined) {
      this.gl.bindBuffer(target, null)
    } else if (size === undefined) {
      this.gl.bindBufferBase(target, index, null)
    } else {
      this.gl.bindBufferRange(target, index, null, offset, size)
    }
  }
}
