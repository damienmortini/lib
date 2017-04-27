export default class GLBuffer {
  constructor({gl, data, size, target = gl.ARRAY_BUFFER, usage = gl.STATIC_DRAW} = {}) {
    this.gl = gl;
    this._data = data;
    this._target = target;

    this._buffer = this.gl.createBuffer();

    this._binded = false;

    this.bind();
    this.gl.bufferData(this._target, this._data || size, usage);
    this.unbind();
  }

  get binded() {
    return this._binded;
  }

  get data() {
    return this._data;
  }

  bind() {
    if(this._binded) {
      return;
    }
    this.gl.bindBuffer(this._target, this._buffer);
    this._binded = true;
  }

  unbind() {
    if(!this._binded) {
      return;
    }
    this.gl.bindBuffer(this._target, null);
    this._binded = false;
  }
};
