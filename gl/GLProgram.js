import Vector2 from "dlib/math/Vector2.js";
import Vector3 from "dlib/math/Vector3.js";
import Vector4 from "dlib/math/Vector4.js";
import Matrix3 from "dlib/math/Matrix3.js";
import Matrix4 from "dlib/math/Matrix4.js";
import Texture2D from "./Texture2D.js";
import TextureCube from "./TextureCube.js";

import Shader from "dlib/3d/Shader.js";

export default class GLProgram extends Shader {
  constructor({gl, vertexShader, fragmentShader, uniforms, attributes, vertexShaderChunks, fragmentShaderChunks, shaders} = {}) {
    super({vertexShader, fragmentShader, uniforms, attributes, vertexShaderChunks, fragmentShaderChunks, shaders});

    let program = gl.createProgram();

    self = this;

    class Attributes extends Map {
      set (name , {location = gl.getAttribLocation(program, name), buffer, size, type = gl.FLOAT, normalized = false, stride = 0, offset = 0}) {
        buffer.bind();
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
        super.set(name, {buffer, size, type, normalized, stride, offset});
        buffer.unbind();
      }
    }

    let uniformLocations = new Map();
    class Uniforms extends Map {
      set (name , ...values) {
        let location = uniformLocations.get(name);
        if(!location) {
          location = gl.getUniformLocation(program, name);
          uniformLocations.set(name, location);
        }
        let value = values[0];
        if(value.length === undefined && values.length > 1) {
          value = self.uniforms.get(name);
          value.set(...values);
        }
        if(value.length <= 4) {
          gl[`uniform${value.length}fv`](location, value);
        }
        else if(value.length === 9) {
          gl.uniformMatrix3fv(location, false, value);
        }
        else if(value.length === 16) {
          gl.uniformMatrix4fv(location, false, value);
        }
        super.set(name, value);
      }
    }
    
    this.gl = gl;
    this._program = program;

    this.vertexShader = this.vertexShader;
    this.fragmentShader = this.fragmentShader;

    this.gl.linkProgram(this._program);
    this.use();

    this.attributes = new Attributes();
    this.uniforms = new Uniforms([...this.uniforms]);
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
    this.gl.useProgram(this._program);
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

    this.gl.attachShader(this._program, shader);
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
