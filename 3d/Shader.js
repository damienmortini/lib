export default class Shader {
  static add(string = "void main() {}", chunks) {
    for (const [key, chunk] of chunks) {
      switch (key) {
        case "start":
          string = string.replace(/^(#version .*?\n(\s*precision highp float;\s)?)?([\s\S]*)/, `$1\n${chunk}\n$3`);
          break;
        case "end":
          string = string.replace(/(}\s*$)/, `\n${chunk}\n$1`);
          break;
        case "main":
          string = string.replace(/(\bvoid\b +\bmain\b[\s\S]*?{\s*)/, `$1\n${chunk}\n`);
          break;
        default:
          string = string.replace(key, chunk);
      }
    }

    return string;
  }

  constructor({
    vertexShader = `#version 300 es
      void main() {
        gl_Position = vec4(0., 0., 0., 1.);
      }
    `,
    fragmentShader = `#version 300 es
      precision highp float;

      out vec4 fragColor;

      void main() {
        fragColor = vec4(1.);
      }
    `,
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
    uniforms = {},
    vertexShaderChunks = [],
    fragmentShaderChunks = [],
    shaders = [],
  } = {}) {
    this.uniforms = uniforms;
    this.uniformTypes = {};

    this._dataTypeConctructors = dataTypeConctructors;

    this.vertexShader = vertexShader;
    this.fragmentShader = fragmentShader;
    this._vertexShaderChunks = [];
    this._fragmentShaderChunks = [];

    this.add({ vertexShaderChunks, fragmentShaderChunks, uniforms });

    for (const shader of shaders) {
      this.add(shader);
    }
  }

  add({ vertexShaderChunks = [], fragmentShaderChunks = [], uniforms = {} } = {}) {
    this.vertexShader = Shader.add(this.vertexShader, vertexShaderChunks);
    this._vertexShaderChunks.push(...vertexShaderChunks);
    this.fragmentShader = Shader.add(this.fragmentShader, fragmentShaderChunks);
    this._fragmentShaderChunks.push(...fragmentShaderChunks);
    for (const key in uniforms) {
      this.uniforms[key] = uniforms[key];
    }
  }

  set vertexShader(value) {
    this._vertexShader = value;
    this._parseUniforms(this._vertexShader);
  }

  get vertexShader() {
    return this._vertexShader;
  }

  set fragmentShader(value) {
    this._fragmentShader = value;
    this._parseUniforms(this._fragmentShader);
  }

  get fragmentShader() {
    return this._fragmentShader;
  }

  get vertexShaderChunks() {
    return this._vertexShaderChunks;
  }

  get fragmentShaderChunks() {
    return this._fragmentShaderChunks;
  }

  _addUniform(name, type, arrayLength) {
    if (this.uniforms[name] !== undefined) {
      return;
    }

    let value;
    let typeMatch;

    this.uniformTypes[name] = type;

    if (/float|double/.test(type)) {
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
        value = new this._dataTypeConctructors["Texture"]();
      } else {
        value = new Array(arrayLength).fill(undefined).map((value) => new this._dataTypeConctructors["Texture"]());
      }
    } else if (/samplerCube/.test(type)) {
      if (isNaN(arrayLength)) {
        value = new this._dataTypeConctructors["TextureCube"]();
      } else {
        value = new Array(arrayLength).fill(undefined).map((value) => new this._dataTypeConctructors["TextureCube"]());
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

    this.uniforms[name] = value;
  }

  // Parse shader strings to extract uniforms

  _parseUniforms(string) {
    const structures = new Map();

    const structRegExp = /struct\s*(.*)\s*{\s*([\s\S]*?)}/g;
    const structMemberRegExp = /^\s*(.[^ ]+) (.[^ ;[\]]+)\[? *(\d+)? *\]?/gm;
    let structMatch;
    while ((structMatch = structRegExp.exec(string))) {
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

    const uniformsRegExp = /^\s*uniform (.[^ ]+) (.[^ ;[\]]+)\[? *(\d+)? *\]?/gm;
    let uniformMatch;
    while ((uniformMatch = uniformsRegExp.exec(string))) {
      const [, type, name, arrayLengthStr] = uniformMatch;

      const structure = structures.get(type);
      if (structure) {
        for (const key in structure) {
          this._addUniform(`${name}.${key}`, structure[key].type, structure[key].arrayLength);
        }
      } else {
        const arrayLength = parseInt(arrayLengthStr);
        this._addUniform(name, type, arrayLength);
      }
    }
  }
}
