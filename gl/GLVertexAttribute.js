import GLBuffer from "./GLBuffer.js";

export default class GLVertexAttribute {
  constructor({
    gl,
    data = undefined,
    buffer = new GLBuffer({
      gl,
    }),
    size = 1,
    type = undefined,
    offset = 0,
    normalized = false,
    stride = 0,
    count = undefined,
    divisor = 0,
  } = { gl }) {
    this.gl = gl;
    this.buffer = buffer;
    this.size = size;
    this.type = type;
    this.offset = offset;
    this.normalized = normalized;
    this.stride = stride;
    this.count = count;
    this.divisor = divisor;

    if (data) {
      this.data = data;
    }
  }

  set count(value) {
    this._count = value;
  }

  get count() {
    return this._count === undefined ? this.data.length / this.size : this._count;
  }

  set type(value) {
    this._type = value;
  }

  get type() {
    let type = this._type;
    if (!type) {
      if (this.data instanceof Float32Array || this.data instanceof Float64Array) {
        type = this.gl.FLOAT;
      } else if (this.data instanceof Int8Array) {
        type = this.gl.BYTE;
      } else if (this.data instanceof Int16Array) {
        type = this.gl.SHORT;
      } else if (this.data instanceof Int32Array) {
        type = this.gl.INT;
      } else if (this.data instanceof Uint8Array) {
        type = this.gl.UNSIGNED_BYTE;
      } else if (this.data instanceof Uint16Array) {
        type = this.gl.UNSIGNED_SHORT;
      } else if (this.data instanceof Uint32Array) {
        type = this.gl.UNSIGNED_INT;
      }
    }
    return type;
  }

  set data(value) {
    this.buffer.data = value;
  }

  get data() {
    return this.buffer.data;
  }
}
