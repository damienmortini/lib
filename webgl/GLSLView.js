export default class GLSLView {
  constructor (canvas, fragmentShaderStr) {
    this.canvas = canvas;
    this.gl = this.canvas.getContext('webgl');

    let vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    this.gl.shaderSource(vertexShader, `
      attribute vec2 aPosition;
      void main() {
          gl_Position = vec4(aPosition, 0, 1);
      }
    `);
    this.gl.compileShader(vertexShader);
    console.log( this.gl.getShaderInfoLog(vertexShader) );

    let fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    this.gl.shaderSource(fragmentShader, fragmentShaderStr);
    this.gl.compileShader(fragmentShader);
    console.log( this.gl.getShaderInfoLog(fragmentShader) );

    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);
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

    let aPosition = this.gl.getAttribLocation(this.program, 'aPosition');
    this.gl.enableVertexAttribArray(aPosition);
    this.gl.vertexAttribPointer(aPosition, 2, this.gl.FLOAT, false, 0, 0);
  }

  update () {
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }
}
