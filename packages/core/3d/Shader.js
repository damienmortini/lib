export default class Shader {
  static addChunks(string = 'void main() {}', chunks) {
    for (const [key, chunk] of chunks) {
      switch (key) {
        case 'start':
          string = string.replace(/^(#version .*?\n(\s*precision highp float;\s)?)?([\s\S]*)/, `$1\n${chunk}\n$3`);
          break;
        case 'end':
          string = string.replace(/(}\s*$)/, `\n${chunk}\n$1`);
          break;
        case 'main':
          string = string.replace(/(\bvoid\b +\bmain\b[\s\S]*?{\s*)/, `$1\n${chunk}\n`);
          break;
        default:
          string = string.replace(key, chunk);
      }
    }
    return string;
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
          super(2);
        }
      },
      Vector3: class Vector3 extends Float32Array {
        constructor() {
          super(3);
        }
      },
      Vector4: class Vector4 extends Float32Array {
        constructor() {
          super(4);
        }
      },
      Matrix3: class Matrix3 extends Float32Array {
        constructor() {
          super([1, 0, 0, 0, 1, 0, 0, 0, 1]);
        }
      },
      Matrix4: class Matrix4 extends Float32Array {
        constructor() {
          super([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        }
      },
      Texture: class Texture { },
      TextureCube: class TextureCube { },
    },
  } = {}) {
    this.uniforms = uniforms;
    this.uniformTypes = new Map();

    this._dataTypeConctructors = dataTypeConctructors;

    this._vertex = Shader.addChunks(vertex, vertexChunks);
    this._fragment = Shader.addChunks(fragment, fragmentChunks);

    this._parseUniforms();
  }

  get vertex() {
    return this._vertex;
  }
  set vertex(value) {
    this._vertex = value;
    this._parseUniforms();
  }

  get fragment() {
    return this._fragment;
  }
  set fragment(value) {
    this._fragment = value;
    this._parseUniforms();
  }

  _createUniform(name, type, arrayLength) {
    if (!arrayLength) {
      this.uniformTypes.set(name, type);
    } else {
      this.uniformTypes.set(name, `${type}array`);
      for (let index = 0; index < arrayLength; index++) {
        this.uniformTypes.set(`${name}[${index}]`, type);
      }
    }

    let value;
    let typeMatch;

    if (/bool/.test(type)) {
      if (isNaN(arrayLength)) {
        value = false;
      } else {
        value = new Array(arrayLength).fill(false);
      }
    } else if (/float|double/.test(type)) {
      if (isNaN(arrayLength)) {
        value = 0;
      } else {
        value = new Array(arrayLength).fill(0);
      }
    } else if (/int|uint/.test(type)) {
      if (isNaN(arrayLength)) {
        value = 0;
      } else {
        value = new Array(arrayLength).fill(0);
      }
    } else if (/sampler2D/.test(type)) {
      if (isNaN(arrayLength)) {
        value = new this._dataTypeConctructors['Texture']();
      } else {
        value = new Array(arrayLength).fill(undefined).map((value) => new this._dataTypeConctructors['Texture']());
      }
    } else if (/samplerCube/.test(type)) {
      if (isNaN(arrayLength)) {
        value = new this._dataTypeConctructors['TextureCube']();
      } else {
        value = new Array(arrayLength).fill(undefined).map((value) => new this._dataTypeConctructors['TextureCube']());
      }
    } else if ((typeMatch = /(.?)vec(\d)/.exec(type))) {
      const vectorLength = typeMatch[2];
      if (isNaN(arrayLength)) {
        value = new this._dataTypeConctructors[`Vector${vectorLength}`]();
      } else {
        value = new Array(arrayLength).fill(undefined).map((value) => new this._dataTypeConctructors[`Vector${vectorLength}`]());
      }
    } else if ((typeMatch = /mat(\d)/.exec(type))) {
      const matrixLength = typeMatch[1];
      if (isNaN(arrayLength)) {
        value = new this._dataTypeConctructors[`Matrix${matrixLength}`]();
      } else {
        value = new Array(arrayLength).fill(undefined).map((value) => new this._dataTypeConctructors[`Matrix${matrixLength}`]());
      }
    } else {
      value = undefined;
    }

    return value;
  }

  // Parse shader strings to extract uniforms

  _parseUniforms() {
    const newUniforms = {};
    this.uniformTypes.clear();

    for (const shaderString of [this.vertex, this.fragment]) {
      const structures = new Map();

      const structRegExp = /struct\s*(.*)\s*{\s*([\s\S]*?)}/g;
      const structMemberRegExp = /^\s*(.[^ ]+) (.[^ ;[\]]+)\[? *(\d+)? *\]?/gm;
      let structMatch;
      while ((structMatch = structRegExp.exec(shaderString))) {
        const structName = structMatch[1];
        const structString = structMatch[2];

        const structure = {};
        let structMemberMatch;
        while ((structMemberMatch = structMemberRegExp.exec(structString))) {
          const [, type, name, arrayLengthStr] = structMemberMatch;
          const arrayLength = parseInt(arrayLengthStr);
          structure[name] = {
            type,
            arrayLength,
          };
        }

        structures.set(structName, structure);
      }

      const uniformsRegExp = /^\s*uniform (highp|mediump|lowp)? *(.[^ ]+) (.[^ ;[\]]+)\[? *(\d+)? *\]?/gm;
      let uniformMatch;
      while ((uniformMatch = uniformsRegExp.exec(shaderString))) {
        let [, , type, name, arrayLengthStr] = uniformMatch;

        const structure = structures.get(type);
        if (structure) {
          for (const key of Object.keys(structure)) {
            name = `${name}.${key}`;
            newUniforms[name] = this._createUniform(name, structure[key].type, structure[key].arrayLength);
          }
        } else {
          const arrayLength = parseInt(arrayLengthStr);
          newUniforms[name] = this._createUniform(name, type, arrayLength);
        }
      }
    }

    for (const [key, value] of Object.entries(newUniforms)) {
      if (!(key in this.uniforms)) {
        this.uniforms[key] = value;
      }
    }

    for (const key of Object.keys(this.uniforms)) {
      if (!(key in newUniforms)) {
        delete this.uniforms[key];
      }
    }
  }
}
