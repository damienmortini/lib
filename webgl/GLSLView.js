import GLUtils from "./GLUtils.js";

export default class GLSLView {
  constructor (canvas, fragmentShaderStr) {
    this.canvas = canvas;
    this.gl = this.canvas.getContext("webgl") || this.canvas.getContext("experimental-webgl");

    this.program = GLUtils.createProgram(this.gl, `
      attribute vec2 aPosition;
      void main() {
          gl_Position = vec4(aPosition, 0, 1);
      }
    `, fragmentShaderStr);
    this.gl.useProgram(this.program);

    let buffer = this.gl.createBuffer();
    let bufferData = [
        -1, -1,
        -1, 1,
        1, -1,
        1, 1
    ];
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(bufferData), this.gl.STATIC_DRAW);

    let aPosition = this.gl.getAttribLocation(this.program, "aPosition");
    this.gl.enableVertexAttribArray(aPosition);
    this.gl.vertexAttribPointer(aPosition, 2, this.gl.FLOAT, false, 0, 0);
  }

  update () {
    this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }
}
