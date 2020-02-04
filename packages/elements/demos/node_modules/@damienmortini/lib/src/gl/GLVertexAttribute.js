import GLBuffer from './GLBuffer.js';

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
  }) {
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
    return this._type || this._dataType;
  }

  set data(value) {
    this.buffer.data = value;

    if (this.data instanceof Float32Array || this.data instanceof Float64Array) {
      this._dataType = this.gl.FLOAT;
    } else if (this.data instanceof Int8Array) {
      this._dataType = this.gl.BYTE;
    } else if (this.data instanceof Int16Array) {
      this._dataType = this.gl.SHORT;
    } else if (this.data instanceof Int32Array) {
      this._dataType = this.gl.INT;
    } else if (this.data instanceof Uint8Array) {
      this._dataType = this.gl.UNSIGNED_BYTE;
    } else if (this.data instanceof Uint16Array) {
      this._dataType = this.gl.UNSIGNED_SHORT;
    } else if (this.data instanceof Uint32Array) {
      this._dataType = this.gl.UNSIGNED_INT;
    }
  }

  get data() {
    return this.buffer.data;
  }
}
