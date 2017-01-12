import Vector2 from "dlib/math/Vector2.js";
import Vector3 from "dlib/math/Vector3.js";
import Vector4 from "dlib/math/Vector4.js";
import Matrix3 from "dlib/math/Matrix3.js";
import Matrix4 from "dlib/math/Matrix4.js";
import Texture2D from "./Texture2D.js";
import TextureCube from "./TextureCube.js";

import Shader from "dlib/3d/Shader.js";

export default class WebGLShader extends Shader {
  constructor({gl, vertexShader, fragmentShader, uniforms, attributes, add} = {}) {
    super({vertexShader, fragmentShader, uniforms, attributes, add});

    this.gl = gl;
    this.program = this.gl.createProgram();

    this.vertexShader = this.vertexShader;
    this.fragmentShader = this.fragmentShader;

    this.gl.linkProgram(this.program);

    this.use();
  }

  set vertexShader(value) {
    super.vertexShader = value;
    if(this.gl) {
      this._updateShader(this.gl.VERTEX_SHADER, this.vertexShader);
    }
  }

  get vertexShader() {
    return super.vertexShader;
  }

  set fragmentShader(value) {
    super.fragmentShader = value;
    if(this.gl) {
      this._updateShader(this.gl.FRAGMENT_SHADER, this.fragmentShader);
    }
  }

  get fragmentShader() {
    return super.fragmentShader;
  }

  use() {
    this.gl.useProgram(this.program);
  }

  _updateShader(type, source) {
    if(!source) {
      return;
    }

    let shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      let error = this.gl.getShaderInfoLog(shader);
      let lineNumber = parseFloat(/ERROR: 0:(\d+):/.exec(error)[1]);
      let shaderLines = source.split("\n");
      console.error(`${error}\nat: ${shaderLines[lineNumber - 1].replace(/^\s*/, "")}`);
    }

    this.gl.attachShader(this.program, shader);
  }

  _parseQualifiers(string) {
    super._parseQualifiers(string, {
      Vector2,
      Vector3,
      Vector4,
      Matrix3,
      Matrix4,
      Texture2D,
      TextureCube
    });
  }
}
