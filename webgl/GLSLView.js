import Shader from "./Shader.js";

export default class GLSLView {
  constructor (canvas, fragmentShaderStr) {
    this.canvas = canvas;
    this.gl = this.canvas.getContext("webgl") || this.canvas.getContext("experimental-webgl");

    this.shader = new Shader(this.gl, `
      attribute vec2 aPosition;
      void main() {
          gl_Position = vec4(aPosition, 0, 1);
      }
    `, fragmentShaderStr);
    this.program = this.shader.program;
    this.shader.bind();

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.createBuffer());
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,
        -1, 1,
        1, -1,
        1, 1
    ]), this.gl.STATIC_DRAW);

    this.shader.attributes.aPosition.pointer();
  }

  render () {
    this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }
}
