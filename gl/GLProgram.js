import Vector2 from "../math/Vector2.js";
import Vector3 from "../math/Vector3.js";
import Vector4 from "../math/Vector4.js";
import Matrix3 from "../math/Matrix3.js";
import Matrix4 from "../math/Matrix4.js";
import Shader from "../3d/Shader.js";
import GLTexture from "./GLTexture.js";

export default class GLProgram extends Shader {
  constructor({
    gl,
    shader = {},
    transformFeedbackVaryings = undefined,
  } = { gl }) {
    super({
      shaders: [shader],
      dataTypeConctructors: {
        Vector2,
        Vector3,
        Vector4,
        Matrix3,
        Matrix4,
        Texture: class extends GLTexture {
          constructor() {
            super({ gl });
          }
        },
        TextureCube: class TextureCube { },
      },
    });

    this.gl = gl;
    this._program = gl.createProgram();
    this._attachedShaders = new Map();

    const self = this;

    this._vertexAttribDivisor = () => { };
    const instancedArraysExtension = this.gl.getExtension("ANGLE_instanced_arrays");
    if (instancedArraysExtension) {
      this._vertexAttribDivisor = instancedArraysExtension.vertexAttribDivisorANGLE.bind(instancedArraysExtension);
    } else if (this.gl.vertexAttribDivisor) {
      this._vertexAttribDivisor = this.gl.vertexAttribDivisor.bind(this.gl);
    }

    class Attributes extends Map {
      set(name, { buffer = undefined, location = self._attributesLocations.get(name), size = undefined, type = gl.FLOAT, normalized = false, stride = 0, offset = 0, divisor = 0 } = {}) {
        if (name instanceof Map) {
          for (const [key, value] of name) {
            this.set(key, value);
          }
          return;
        }
        buffer.bind();
        if (location === undefined) {
          location = gl.getAttribLocation(self._program, name);
          if (location === -1) {
            console.warn(`Attribute "${name}" is missing or never used`);
          }
          self._attributesLocations.set(name, location);
        }
        gl.enableVertexAttribArray(location);

        if (type === gl.FLOAT || type === gl.HALF_FLOAT) {
          gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
        } else {
          gl.vertexAttribIPointer(location, size, type, normalized, stride, offset);
        }

        buffer.unbind();
        self._vertexAttribDivisor(location, divisor);
        super.set(name, { buffer, size, type, normalized, stride, offset });
      }
    }

    class Uniforms extends Map {
      set(name, ...values) {
        let value = values[0];
        if (value === undefined) {
          return;
        }

        let location = self._uniformLocations.get(name);
        if (location === undefined) {
          location = gl.getUniformLocation(self._program, name);
          self._uniformLocations.set(name, location);
        }

        let texture;

        if (value.length === undefined) {
          if (value instanceof GLTexture) {
            let unit = 0;
            for (const uniformName in self.uniformTypes) {
              if (self.uniformTypes[uniformName].startsWith("sampler")) {
                if (uniformName === name) {
                  texture = value;
                  values = [unit];
                  break;
                }
                unit++;
              }
            }
          } else if (value instanceof Object) {
            for (const key in value) {
              self.uniforms.set(`${name}.${key}`, value[key]);
            }
            return;
          }
          if (values.length > 1) {
            value = self.uniforms.get(name);
            value.set(...values);
          } else {
            value = values;
          }
        } else if (value[0] instanceof Object) {
          for (let i = 0; i < value.length; i++) {
            if (value[0].length) {
              self.uniforms.set(`${name}[${i}]`, value[i]);
            } else {
              for (const key in value[i]) {
                self.uniforms.set(`${name}[${i}].${key}`, value[i][key]);
              }
            }
          }
          return;
        }

        if (location === null) {
          return;
        }

        const type = self.uniformTypes[name.replace(/\[.*?\]/, "")];

        if (type === "float" || type === "bool") {
          gl.uniform1fv(location, value);
        } else if (type === "vec2") {
          gl.uniform2fv(location, value);
        } else if (type === "vec3") {
          gl.uniform3fv(location, value);
        } else if (type === "vec4") {
          gl.uniform4fv(location, value);
        } else if (type === "int" || type.startsWith("sampler")) {
          gl.uniform1iv(location, value);
        } else if (type === "ivec2") {
          gl.uniform2iv(location, value);
        } else if (type === "ivec3") {
          gl.uniform3iv(location, value);
        } else if (type === "ivec4") {
          gl.uniform4iv(location, value);
        } else if (type === "mat3") {
          gl.uniformMatrix3fv(location, false, value);
        } else if (type === "mat4") {
          gl.uniformMatrix4fv(location, false, value);
        }

        super.set(name, texture || value);
      }
    }

    if (transformFeedbackVaryings) {
      this.gl.transformFeedbackVaryings(this._program, transformFeedbackVaryings, gl.INTERLEAVED_ATTRIBS);
    }

    this.vertexShader = this.vertexShader;
    this.fragmentShader = this.fragmentShader;

    this.use();

    this.attributes = new Attributes();

    const rawUniforms = this.uniforms;
    this.uniforms = new Uniforms();
    for (const key in rawUniforms) {
      this.uniforms.set(key, rawUniforms[key]);
    }
  }

  set vertexShader(value) {
    super.vertexShader = value;
    if (this.gl) {
      this._updateShader(this.gl.VERTEX_SHADER, this.vertexShader);
    }
  }

  get vertexShader() {
    return super.vertexShader;
  }

  set fragmentShader(value) {
    super.fragmentShader = value;
    if (this.gl) {
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
    if (!source) {
      return;
    }

    if (this.gl.getParameter(this.gl.VERSION).startsWith("WebGL 1.0")) {
      source = source.replace(/#version.*?\n/g, "");
      source = source.replace(/\btexture\b/g, "texture2D");
      if (type === this.gl.VERTEX_SHADER) {
        source = source.replace(/\bin\b/g, "attribute");
        source = source.replace(/\bout\b/g, "varying");
      } else {
        source = source.replace(/\bin\b/g, "varying");
        const results = /out vec4 (.*?);/.exec(source);
        if (results) {
          const fragColorName = results[1];
          source = source.replace(/out.*?;/, "");
          source = source.replace(new RegExp(`\\b${fragColorName}\\b`, "g"), "gl_FragColor");
        }
      }
    }

    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    const shaderInfoLog = this.gl.getShaderInfoLog(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const lineNumberResults = /ERROR: 0:(\d+):/.exec(shaderInfoLog);
      if (lineNumberResults) {
        const lineNumber = parseFloat(lineNumberResults[1]);
        const shaderLines = source.split("\n");
        const typeName = type === this.gl.VERTEX_SHADER ? "Vertex Shader" : "Fragment Shader";
        console.groupCollapsed(`${typeName} source`);
        console.warn(source);
        console.groupEnd();
        throw new Error(`${typeName}: ${shaderInfoLog}\nat: ${shaderLines[lineNumber - 1].replace(/^\s*/, "")}`);
      } else {
        throw new Error(shaderInfoLog);
      }
    } else if (shaderInfoLog) {
      console.warn(shaderInfoLog);
    }

    const attachedShader = this._attachedShaders.get(type);
    if (attachedShader) {
      this.gl.detachShader(this._program, attachedShader);
      this.gl.deleteShader(attachedShader);
    }

    this.gl.attachShader(this._program, shader);
    this.gl.deleteShader(shader);
    this._attachedShaders.set(type, shader);

    if (this._attachedShaders.size === 2) {
      this.gl.linkProgram(this._program);
      const programInfoLog = this.gl.getProgramInfoLog(this._program);
      if (!this.gl.getProgramParameter(this._program, this.gl.LINK_STATUS)) {
        throw new Error(programInfoLog);
      } else if (programInfoLog) {
        console.warn(programInfoLog);
      }

      // TODO: Check when issue is resolved on Safari and comment out

      // for (let [type, attachedShader] of this._attachedShaders) {
      //   this.gl.detachShader(this._program, attachedShader);
      //   this.gl.deleteShader(attachedShader);
      //   this._attachedShaders.delete(type);
      // }

      this._attributesLocations = new Map();
      this._uniformLocations = new Map();
    }
  }
}
