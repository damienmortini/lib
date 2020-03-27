import Vector2 from '../math/Vector2.js';
import Vector3 from '../math/Vector3.js';
import Vector4 from '../math/Vector4.js';
import Matrix3 from '../math/Matrix3.js';
import Matrix4 from '../math/Matrix4.js';
import Shader from '../3d/Shader.js';
import GLTexture from './GLTexture.js';

export default class GLProgram {
  constructor({
    gl,
    shader = new Shader(),
    transformFeedbackVaryings = undefined,
  } = { gl }) {
    // super({
    //   uniforms,
    //   vertexShader,
    //   fragmentShader,
    //   vertexShaderChunks,
    //   fragmentShaderChunks,
    //   shaders,
    //   dataTypeConctructors: {
    //     Vector2,
    //     Vector3,
    //     Vector4,
    //     Matrix3,
    //     Matrix4,
    //     Texture: class extends GLTexture {
    //       constructor() {
    //         super({ gl });
    //       }
    //     },
    //     TextureCube: class TextureCube { },
    //   },
    // });

    this.gl = gl;

    this._shader = shader instanceof Shader ? shader : new Shader(shader);
    this._program = gl.createProgram();
    this._attachedShaders = new Map();

    this._vertexAttribDivisor = () => { };
    const instancedArraysExtension = this.gl.getExtension('ANGLE_instanced_arrays');
    if (instancedArraysExtension) {
      this._vertexAttribDivisor = instancedArraysExtension.vertexAttribDivisorANGLE.bind(instancedArraysExtension);
    } else if (this.gl.vertexAttribDivisor) {
      this._vertexAttribDivisor = this.gl.vertexAttribDivisor.bind(this.gl);
    }

    const self = this;

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
      set(name, value) {
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
              if (self.uniformTypes[uniformName].startsWith('sampler')) {
                if (uniformName === name) {
                  texture = value;
                  value = unit;
                  break;
                }
                unit++;
              }
            }
          } else if (value instanceof Object) {
            for (const key of Object.keys(value)) {
              self.uniforms.set(`${name}.${key}`, value[key]);
            }
            return;
          }
        } else if (value[0] instanceof Object) {
          for (let i = 0; i < value.length; i++) {
            if (value[0].length) {
              self.uniforms.set(`${name}[${i}]`, value[i]);
            } else {
              for (const key of Object.keys(value[i])) {
                self.uniforms.set(`${name}[${i}].${key}`, value[i][key]);
              }
            }
          }
          return;
        }

        self._shader.uniforms[name] = texture || value;
        super.set(name, texture || value);

        if (location === null) {
          return;
        }

        const type = self.uniformTypes[name.replace(/\[.*?\]/, '')];

        if (type === 'float' || type === 'bool') {
          gl.uniform1f(location, value);
        } else if (type === 'vec2') {
          gl.uniform2fv(location, value);
        } else if (type === 'vec3') {
          gl.uniform3fv(location, value);
        } else if (type === 'vec4') {
          gl.uniform4fv(location, value);
        } else if (type === 'int' || type.startsWith('sampler')) {
          gl.uniform1i(location, value);
        } else if (type === 'ivec2') {
          gl.uniform2iv(location, value);
        } else if (type === 'ivec3') {
          gl.uniform3iv(location, value);
        } else if (type === 'ivec4') {
          gl.uniform4iv(location, value);
        } else if (type === 'mat3') {
          gl.uniformMatrix3fv(location, false, value);
        } else if (type === 'mat4') {
          gl.uniformMatrix4fv(location, false, value);
        }
      }
    }

    if (transformFeedbackVaryings) {
      this.gl.transformFeedbackVaryings(this._program, transformFeedbackVaryings, gl.INTERLEAVED_ATTRIBS);
    }

    this.attributes = new Attributes();
    this.uniforms = new Uniforms();

    this.vertexShader = this._shader.vertex;
    this.fragmentShader = this._shader.fragment;
  }

  set vertexShader(value) {
    this._shader.vertex = value;
    this._updateShader(this.gl.VERTEX_SHADER, this._shader.vertex);
  }

  get vertexShader() {
    return this._shader.vertex;
  }

  set fragmentShader(value) {
    this._shader.fragment = value;
    this._updateShader(this.gl.FRAGMENT_SHADER, this._shader.fragment);
  }

  get fragmentShader() {
    return this._shader.fragment;
  }

  get uniformTypes() {
    return this._shader.uniformTypes;
  }

  use() {
    this.gl.useProgram(this._program);
  }

  _updateShader(type, source) {
    if (!source) {
      return;
    }

    if (this.gl.getParameter(this.gl.VERSION).startsWith('WebGL 1.0')) {
      source = source.replace(/#version.*?\n/g, '');
      source = source.replace(/\btexture\b/g, 'texture2D');
      if (type === this.gl.VERTEX_SHADER) {
        source = source.replace(/(^\s*)\bin\b/gm, '$1attribute');
        source = source.replace(/(^\s*)\bout\b/gm, '$1varying');
      } else {
        source = source.replace(/(^\s*)\bin\b/gm, '$1varying');
        const results = /out vec4 (.*?);/.exec(source);
        if (results) {
          const fragColorName = results[1];
          source = source.replace(/out.*?;/, '');
          source = source.replace(new RegExp(`\\b${fragColorName}\\b`, 'g'), 'gl_FragColor');
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
        const shaderLines = source.split('\n');
        const typeName = type === this.gl.VERTEX_SHADER ? 'Vertex Shader' : 'Fragment Shader';
        console.groupCollapsed(`${typeName} source`);
        console.warn(source);
        console.groupEnd();
        throw new Error(`${typeName}: ${shaderInfoLog}\nat: ${shaderLines[lineNumber - 1].replace(/^\s*/, '')}`);
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

      this.use();
      for (const key of Object.keys(this._shader.uniforms)) {
        this.uniforms.set(key, this._shader.uniforms[key]);
      }
    }
  }
}
