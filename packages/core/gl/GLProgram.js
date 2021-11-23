import * as GLSLShader from '../gl/GLSLShader.js'

const GL_UNIFORM_TYPE_MAP = new Map([
  ['float', 'uniform1f'],
  ['vec2', 'uniform2fv'],
  ['vec3', 'uniform3fv'],
  ['vec4', 'uniform4fv'],
  ['int', 'uniform1i'],
  ['ivec2', 'uniform2iv'],
  ['ivec3', 'uniform3iv'],
  ['ivec4', 'uniform4iv'],
  ['uint', 'uniform1ui'],
  ['uvec2', 'uniform2uiv'],
  ['uvec3', 'uniform3uiv'],
  ['uvec4', 'uniform4uiv'],
  ['bool', 'uniform1i'],
  ['bvec2', 'uniform2iv'],
  ['bvec3', 'uniform3iv'],
  ['bvec4', 'uniform4iv'],
  ['mat2', 'uniformMatrix2fv'],
  ['mat3', 'uniformMatrix3fv'],
  ['mat4', 'uniformMatrix4fv'],
  ['sampler2D', 'uniform1i'],
  ['samplerCube', 'uniform1i'],
])

export default class GLProgram {
  #program
  #attachedShaders = new Map()
  #textureUnits = new Map()
  #vertex = ''
  #fragment = ''
  #vertexUniformData = new Map()
  #fragmentUniformData = new Map()
  #uniformData = new Map()
  #attributesLocations = new Map()
  #uniformLocations = new Map()

  constructor({
    gl,
    uniforms = {},
    vertex = GLSLShader.VERTEX,
    fragment = GLSLShader.FRAGMENT,
    transformFeedbackVaryings = undefined,
  }) {
    this.gl = gl

    this.#vertex = vertex
    this.#fragment = fragment
    this.#program = gl.createProgram()

    this._vertexAttribDivisor = () => { }
    const instancedArraysExtension = this.gl.getExtension('ANGLE_instanced_arrays')
    if (instancedArraysExtension) {
      this._vertexAttribDivisor = instancedArraysExtension.vertexAttribDivisorANGLE.bind(instancedArraysExtension)
    } else if (this.gl.vertexAttribDivisor) {
      this._vertexAttribDivisor = this.gl.vertexAttribDivisor.bind(this.gl)
    }

    const self = this

    class Attributes extends Map {
      set(name, { buffer = undefined, location = self.#attributesLocations.get(name), size = 1, componentType = gl.FLOAT, normalized = false, byteStride = 0, byteOffset = 0, divisor = 0 } = {}) {
        if (name instanceof Map) {
          for (const [key, value] of name) {
            this.set(key, value)
          }
          return
        }
        buffer.bind()
        if (location === undefined) {
          location = gl.getAttribLocation(self.#program, name)
          self.#attributesLocations.set(name, location)
        }
        if (location !== -1) {
          gl.enableVertexAttribArray(location)
          if (self.gl instanceof WebGLRenderingContext || componentType === gl.FLOAT || componentType === gl.HALF_FLOAT) {
            if (componentType === gl.UNSIGNED_INT) componentType = gl.FLOAT
            gl.vertexAttribPointer(location, size, componentType, normalized, byteStride, byteOffset)
          } else {
            gl.vertexAttribIPointer(location, size, componentType, byteStride, byteOffset)
          }
          self._vertexAttribDivisor(location, divisor)
        }

        buffer.unbind()
        super.set(name, { buffer, size, componentType, normalized, byteStride, byteOffset })
      }
    }

    class Uniforms extends Map {
      set(name, value) {
        self.#uploadUniform(name, value)
        return super.set(name, value)
      }
    }

    if (transformFeedbackVaryings) {
      this.gl.transformFeedbackVaryings(this.#program, transformFeedbackVaryings, gl.INTERLEAVED_ATTRIBS)
    }

    this.#updateShader(this.gl.VERTEX_SHADER, this.#vertex)
    this.#updateShader(this.gl.FRAGMENT_SHADER, this.#fragment)

    this.attributes = new Attributes()
    this.uniforms = new Uniforms(Object.entries(uniforms))
  }

  #uploadUniform = (name, value) => {
    if (value === undefined) {
      return
    }

    const type = this.uniformData.get(name)?.type

    if (value instanceof Object && !type) {
      for (const key of [...Object.keys(value), ...Object.keys(Object.getPrototypeOf(value))]) {
        this.#uploadUniform(value[0] !== undefined ? `${name}[${key}]` : `${name}.${key}`, value[key])
      }
      return
    }

    let location = this.#uniformLocations.get(name)
    if (location === undefined) {
      location = this.gl.getUniformLocation(this.#program, name)
      this.#uniformLocations.set(name, location)
    }

    if (location === null) {
      return
    }

    if (type.startsWith('mat')) {
      this.gl[GL_UNIFORM_TYPE_MAP.get(type)](location, false, value)
    } else if (type.startsWith('sampler')) {
      this.gl[GL_UNIFORM_TYPE_MAP.get(type)](location, this.#textureUnits.get(name))
    } else {
      this.gl[GL_UNIFORM_TYPE_MAP.get(type)](location, value)
    }
  }

  set vertex(value) {
    this.#vertex = value
    this.#updateShader(this.gl.VERTEX_SHADER, this.#vertex)
  }

  get vertex() {
    return this.#vertex
  }

  set fragment(value) {
    this.#fragment = value
    this.#updateShader(this.gl.FRAGMENT_SHADER, this.#fragment)
  }

  get fragment() {
    return this.#fragment
  }

  get uniformData() {
    return this.#uniformData
  }

  get textureUnits() {
    return this.#textureUnits
  }

  use() {
    this.gl.useProgram(this.#program)
  }

  #updateShader(type, source) {
    if (!source) {
      return
    }

    if (type === this.gl.VERTEX_SHADER) this.#vertexUniformData = GLSLShader.getUniformData(source)
    else this.#fragmentUniformData = GLSLShader.getUniformData(source)
    this.#uniformData = new Map([...this.#vertexUniformData, ...this.#fragmentUniformData])

    if (this.gl instanceof WebGLRenderingContext) {
      source = source.replace(/#version.*?\n/g, '')
      source = source.replace(/\btexture\b/g, 'texture2D')
      source = source.replace(/\buvec(.)\b/g, 'vec$1')
      source = source.replace(/\bflat\b/g, '')
      if (type === this.gl.VERTEX_SHADER) {
        source = source.replace(/(^\s*)\bin\b/gm, '$1attribute')
        source = source.replace(/(^\s*)\bout\b/gm, '$1varying')
      } else {
        source = source.replace(/(^\s*)\bin\b/gm, '$1varying')
        const results = /out vec4 (.*?);/.exec(source)
        if (results) {
          const fragColorName = results[1]
          source = source.replace(/out.*?;/, '')
          source = source.replace(new RegExp(`\\b${fragColorName}\\b`, 'g'), 'gl_FragColor')
        }
      }
    }

    const shader = this.gl.createShader(type)
    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)

    const shaderInfoLog = this.gl.getShaderInfoLog(shader)
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const lineNumberResults = /ERROR: 0:(\d+):/.exec(shaderInfoLog)
      if (lineNumberResults) {
        const lineNumber = parseFloat(lineNumberResults[1])
        const shaderLines = source.split('\n')
        const typeName = type === this.gl.VERTEX_SHADER ? 'Vertex Shader' : 'Fragment Shader'
        console.groupCollapsed(`${typeName} source`)
        console.warn(source)
        console.groupEnd()
        throw new Error(`${typeName}: ${shaderInfoLog}\nat: ${shaderLines[lineNumber - 1].replace(/^\s*/, '')}`)
      } else {
        throw new Error(shaderInfoLog)
      }
    } else if (shaderInfoLog) {
      console.warn(shaderInfoLog)
    }

    const attachedShader = this.#attachedShaders.get(type)
    if (attachedShader) {
      this.gl.detachShader(this.#program, attachedShader)
      this.gl.deleteShader(attachedShader)
    }

    this.gl.attachShader(this.#program, shader)
    this.gl.deleteShader(shader)
    this.#attachedShaders.set(type, shader)

    if (this.#attachedShaders.size === 2) {
      this.gl.linkProgram(this.#program)
      const programInfoLog = this.gl.getProgramInfoLog(this.#program)
      if (!this.gl.getProgramParameter(this.#program, this.gl.LINK_STATUS)) {
        throw new Error(programInfoLog)
      } else if (programInfoLog) {
        console.warn(programInfoLog)
      }

      this.#attributesLocations.clear()
      this.#uniformLocations.clear()

      this.use()
      this.#textureUnits.clear()

      if (this.uniforms) {
        for (const name of this.uniforms.keys()) {
          if (!this.#uniformData.has(name)) this.uniforms.delete(name)
        }
        let unit = 0
        for (const [key, value] of this.uniforms) {
          if (this.uniformData.get(key).type.startsWith('sampler')) {
            this.#textureUnits.set(key, unit)
            unit++
          }
          this.#uploadUniform(key, value)
        }
      }
    }
  }
}
