export default class GLBuffer {
  constructor({gl, size = 0, data = new ArrayBuffer(size), target = gl.ARRAY_BUFFER, usage = gl.STATIC_DRAW} = {}) {
    this.gl = gl;
    this._target = target;
    this._usage = usage;

    this._buffer = this.gl.createBuffer();
    
    this.data = data;
  }

  set data(value) {
    this._data = value;

    this.bind();
    this.gl.bufferData(this._target, this._data, this._usage);
    this.unbind();
  }

  get data() {
    return this._data;
  }

  bind() {
    this.gl.bindBuffer(this._target, this._buffer);
  }

  unbind() {
    this.gl.bindBuffer(this._target, null);
  }
};
