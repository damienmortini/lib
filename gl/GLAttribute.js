import GLBuffer from "./GLBuffer.js";

export default class GLAttribute {
  constructor({
    gl = undefined,
    data = undefined,
    buffer = new GLBuffer({
      gl
    }),
    size = 1,
    offset = 0,
    normalized = false, 
    stride = 0, 
    divisor = 0
  } = {}) {
    this.count = undefined;
    this.type = undefined;
    
    this.gl = gl;
    this.buffer = buffer;
    this.size = size;
    this.offset = offset;

    if(data) {
      this.data = data;
    }
  }

  set size(value) {
    this._size = value;
    this._update();
  }

  get size() {
    return this._size;
  }

  set data(value) {
    this.buffer.data = value;
    this._update();
  }

  get data() {
    return this.buffer.data;
  }

  set buffer(value) {
    this._buffer = value;
    this._update();
  }

  get buffer() {
    return this._buffer;
  }

  _update() {
    if(!this.data) {
      return;
    }

    // Compute count
    this.count = this.data.length / this.size;

    // Type detection
    if(this.data instanceof Float32Array || this.data instanceof Float64Array) {
      this.type = this.gl.FLOAT;
    } else if(this.data instanceof Uint8Array) {
      this.type = this.gl.UNSIGNED_BYTE;
    } else if(this.data instanceof Uint16Array) {
      this.type = this.gl.UNSIGNED_SHORT;
    } else if (this.data instanceof Uint32Array) {
      this.type = this.gl.UNSIGNED_INT
    }
  }
};
