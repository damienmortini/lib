export default class Shader {
  static addChunks(string = 'void main() {}', chunks) {
    for (const [key, chunk] of chunks) {
      switch (key) {
        case 'start':
          string = string.replace(/^(#version .*?\n(\s*precision highp float;\s)?)?([\s\S]*)/, `$1\n${chunk}\n$3`)
          break
        case 'end':
          string = string.replace(/(}\s*$)/, `\n${chunk}\n$1`)
          break
        case 'main':
          string = string.replace(/(\bvoid\b +\bmain\b[\s\S]*?{\s*)/, `$1\n${chunk}\n`)
          break
        default:
          string = string.replace(key, chunk)
      }
    }
    return string
  }

  constructor({
    vertex = `#version 300 es
      void main() {
        gl_Position = vec4(0., 0., 0., 1.);
      }
    `,
    fragment = `#version 300 es
      precision highp float;

      out vec4 fragColor;

      void main() {
        fragColor = vec4(1.);
      }
    `,
    vertexChunks = [],
    fragmentChunks = [],
    uniforms = {},
    dataTypeConctructors = {
      Vector2: class Vector2 extends Float32Array {
        constructor() {
          super(2)
        }
      },
      Vector3: class Vector3 extends Float32Array {
        constructor() {
          super(3)
        }
      },
      Vector4: class Vector4 extends Float32Array {
        constructor() {
          super(4)
        }
      },
      Matrix3: class Matrix3 extends Float32Array {
        constructor() {
          super([1, 0, 0, 0, 1, 0, 0, 0, 1])
        }
      },
      Matrix4: class Matrix4 extends Float32Array {
        constructor() {
          super([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
        }
      },
      Texture: class Texture { },
      TextureCube: class TextureCube { },
    },
  } = {}) {
    this.uniforms = uniforms
    this.uniformTypes = new Map()

    this._dataTypeConctructors = dataTypeConctructors

    this._vertex = Shader.addChunks(vertex, vertexChunks)
    this._fragment = Shader.addChunks(fragment, fragmentChunks)

    this._parseUniforms()
  }

  get vertex() {
    return this._vertex
  }
  set vertex(value) {
    this._vertex = value
    this._parseUniforms()
  }

  get fragment() {
    return this._fragment
  }
  set fragment(value) {
    this._fragment = value
    this._parseUniforms()
  }

  _createUniform({ uniforms, name, type, arrayLength, structures }) {
    if (arrayLength) {
      for (let index = 0; index < arrayLength; index++) {
        this._createUniform({
          uniforms,
          name: `${name}[${index}]`,
          type,
          arrayLength: null,
          structures,
        })
      }
      return
    }

    const structure = structures?.get(type)

    if (structure) {
      for (const key of Object.keys(structure)) {
        this._createUniform({
          uniforms,
          name: `${name}.${key}`,
          type: structure[key].type,
          arrayLength: structure[key].arrayLength,
          structures,
        })
      }
      return
    }

    let value
    let typeMatch

    if (/bool/.test(type)) {
      if (isNaN(arrayLength)) {
        value = false
      } else {
        value = new Array(arrayLength).fill(false)
      }
    } else if (/float|double/.test(type)) {
      if (isNaN(arrayLength)) {
        value = 0
      } else {
        value = new Array(arrayLength).fill(0)
      }
    } else if (/int|uint/.test(type)) {
      if (isNaN(arrayLength)) {
        value = 0
      } else {
        value = new Array(arrayLength).fill(0)
      }
    } else if (/sampler2D/.test(type)) {
      if (isNaN(arrayLength)) {
        value = new this._dataTypeConctructors['Texture']()
      } else {
        value = new Array(arrayLength).fill(undefined).map((value) => new this._dataTypeConctructors['Texture']())
      }
    } else if (/samplerCube/.test(type)) {
      if (isNaN(arrayLength)) {
        value = new this._dataTypeConctructors['TextureCube']()
      } else {
        value = new Array(arrayLength).fill(undefined).map((value) => new this._dataTypeConctructors['TextureCube']())
      }
    } else if ((typeMatch = /(.?)vec(\d)/.exec(type))) {
      const vectorLength = typeMatch[2]
      if (isNaN(arrayLength)) {
        value = new this._dataTypeConctructors[`Vector${vectorLength}`]()
      } else {
        value = new Array(arrayLength).fill(undefined).map((value) => new this._dataTypeConctructors[`Vector${vectorLength}`]())
      }
    } else if ((typeMatch = /mat(\d)/.exec(type))) {
      const matrixLength = typeMatch[1]
      if (isNaN(arrayLength)) {
        value = new this._dataTypeConctructors[`Matrix${matrixLength}`]()
      } else {
        value = new Array(arrayLength).fill(undefined).map((value) => new this._dataTypeConctructors[`Matrix${matrixLength}`]())
      }
    } else {
      value = undefined
    }

    this.uniformTypes.set(name, type)
    uniforms[name] = value

    return value
  }

  // Parse shader strings to extract uniforms

  _parseUniforms() {
    const newUniforms = {}
    this.uniformTypes.clear()

    for (const shaderString of [this.vertex, this.fragment]) {
      const structures = new Map()

      const structRegExp = /struct\s*(.*)\s*{\s*([\s\S]*?)}/g
      const structMemberRegExp = /^\s*(?:highp|mediump|lowp)?\s*(.[^ ]+) (.[^ ;[\]]+)\[? *(\d+)? *\]?/gm
      for (const [, structName, structString] of shaderString.matchAll(structRegExp)) {
        const structure = {}
        for (const [, type, name, arrayLengthStr] of structString.matchAll(structMemberRegExp)) {
          const arrayLength = parseInt(arrayLengthStr)
          structure[name] = {
            type,
            ...(arrayLength ? { arrayLength } : {}),
          }
        }

        structures.set(structName, structure)
      }

      const uniformsRegExp = /^\s*uniform (?:highp|mediump|lowp)? *(.[^ ]+) (.[^ ;[\]]+)\[? *(\d+)? *\]?/gm
      for (const [, type, name, arrayLengthStr] of shaderString.matchAll(uniformsRegExp)) {
        this._createUniform({
          uniforms: newUniforms,
          name,
          type,
          arrayLength: parseInt(arrayLengthStr),
          structures,
        })
      }
    }

    for (const [key, value] of Object.entries(newUniforms)) {
      if (!(key in this.uniforms)) {
        this.uniforms[key] = value
      }
    }

    for (const key of Object.keys(this.uniforms)) {
      if (!(key in newUniforms)) {
        delete this.uniforms[key]
      }
    }
  }
}
