import Shader from '../3d/Shader.js';

export default class GLProgram {
  constructor({
    gl,
    shader = new Shader(),
    transformFeedbackVaryings = undefined,
  }) {
    this.gl = gl;

    this._webGL1 = this.gl.getParameter(this.gl.VERSION).startsWith('WebGL 1.0');
    this._shader = shader instanceof Shader ? shader : new Shader(shader);
    this._program = gl.createProgram();
    this._attachedShaders = new Map();
    this._textureUnits = new Map();

    this._vertexAttribDivisor = () => { };
    const instancedArraysExtension = this.gl.getExtension('ANGLE_instanced_arrays');
    if (instancedArraysExtension) {
      this._vertexAttribDivisor = instancedArraysExtension.vertexAttribDivisorANGLE.bind(instancedArraysExtension);
    } else if (this.gl.vertexAttribDivisor) {
      this._vertexAttribDivisor = this.gl.vertexAttribDivisor.bind(this.gl);
    }

    const self = this;

    class Attributes extends Map {
      set(name, { buffer = undefined, location = self._attributesLocations.get(name), size = 1, componentType = gl.FLOAT, normalized = false, byteStride = 0, byteOffset = 0, divisor = 0 } = {}) {
        if (name instanceof Map) {
          for (const [key, value] of name) {
            this.set(key, value);
          }
          return;
        }
        buffer.bind();
        if (location === undefined) {
          location = gl.getAttribLocation(self._program, name);
          self._attributesLocations.set(name, location);
        }
        if (location !== -1) {
          gl.enableVertexAttribArray(location);
          if (self._webGL1 || componentType === gl.FLOAT || componentType === gl.HALF_FLOAT) {
            if (componentType === gl.UNSIGNED_INT) componentType = gl.FLOAT;
            gl.vertexAttribPointer(location, size, componentType, normalized, byteStride, byteOffset);
          } else {
            gl.vertexAttribIPointer(location, size, componentType, byteStride, byteOffset);
          }
          self._vertexAttribDivisor(location, divisor);
        }

        buffer.unbind();
        super.set(name, { buffer, size, componentType, normalized, byteStride, byteOffset });
      }
    }

    const uploadUniform = (name, value) => {
      let location = self._uniformLocations.get(name);
      if (location === undefined) {
        location = gl.getUniformLocation(self._program, name);
        self._uniformLocations.set(name, location);
      }

      if (location === null) {
        return;
      }
      const type = self.uniformTypes.get(name);

      if (type === 'float' || type === 'bool') {
        gl.uniform1f(location, value);
      } else if (type === 'vec2') {
        gl.uniform2fv(location, value);
      } else if (type === 'vec3') {
        gl.uniform3fv(location, value);
      } else if (type === 'vec4') {
        gl.uniform4fv(location, value);
      } else if (type === 'int') {
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
      } else if (type.startsWith('sampler')) {
        gl.uniform1i(location, self._textureUnits.get(name));
      } else if (type.endsWith('array')) {
        for (let i = 0; i < value.length; i++) {
          uploadUniform(`${name}[${i}]`, value[i]);
        }
      } else if (value instanceof Object) {
        for (const key of Object.keys(value)) {
          uploadUniform(`${name}.${key}`, value[key]);
        }
      }
    };

    class Uniforms extends Map {
      set(name, value) {
        if (value === undefined) {
          return;
        }

        uploadUniform(name, value);

        self._shader.uniforms[name] = value;
        super.set(name, value);
      }
    }

    if (transformFeedbackVaryings) {
      this.gl.transformFeedbackVaryings(this._program, transformFeedbackVaryings, gl.INTERLEAVED_ATTRIBS);
    }

    this.attributes = new Attributes();
    this.uniforms = new Uniforms();

    this._updateShader(this.gl.VERTEX_SHADER, this._shader.vertex);
    this._updateShader(this.gl.FRAGMENT_SHADER, this._shader.fragment);
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

  get textureUnits() {
    return this._textureUnits;
  }

  use() {
    this.gl.useProgram(this._program);
  }

  _updateShader(type, source) {
    if (!source) {
      return;
    }

    if (this._webGL1) {
      source = source.replace(/#version.*?\n/g, '');
      source = source.replace(/\btexture\b/g, 'texture2D');
      source = source.replace(/\buvec(.)\b/g, 'vec$1');
      source = source.replace(/\bflat\b/g, '');
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
      this.uniforms.clear();
      this._textureUnits.clear();
      let unit = 0;
      for (const [key, value] of Object.entries(this._shader.uniforms)) {
        if (this.uniformTypes.get(key).startsWith('sampler')) {
          this._textureUnits.set(key, unit);
          unit++;
        }
        this.uniforms.set(key, value);
      }
    }
  }
}
