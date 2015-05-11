export default class GLSLView {
  constructor (canvas, fragmentShaderStr) {

    let gl = this.gl = canvas.getContext('webgl');

    let vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, `
      attribute vec2 aPosition;
      void main() {
          gl_Position = vec4(aPosition, 0, 1);
      }
    `);
    gl.compileShader(vertexShader);
    console.log( gl.getShaderInfoLog(vertexShader) );

    let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderStr);
    gl.compileShader(fragmentShader);
    console.log( gl.getShaderInfoLog(fragmentShader) );

    this.program = gl.createProgram();
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);
    gl.useProgram(this.program);

    let buffer = gl.createBuffer();
    let bufferData = [
        -1, -1,
        -1, 1,
        1, -1,
        1, 1
    ];
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bufferData), gl.STATIC_DRAW);

    let aPosition = gl.getAttribLocation(this.program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
  }

  update () {
    let gl = this.gl;
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
