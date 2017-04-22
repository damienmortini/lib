export default class GLBuffer {
  static bind({gl, buffer, target = gl.ARRAY_BUFFER} = {}) {
    gl.bindBuffer(target, buffer instanceof GLBuffer ? buffer._buffer : buffer);
  }

  constructor({gl, size, data, usage = gl.STATIC_DRAW, target = gl.ARRAY_BUFFER} = {}) {
    this.gl = gl;
    this._buffer = this.gl.createBuffer();

    this.bind({target});
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data || size, this.gl.STATIC_DRAW);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    GLBuffer.bind({gl: this.gl, buffer: null});
  }

  bind({target} = {}) {
    GLBuffer.bind({gl: this.gl, target, buffer: this});
  }
};
