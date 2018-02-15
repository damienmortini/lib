export default class Shader {
  static add(string = "void main() {}", chunks) {
    function regExpFromKey(key) {
      let regExpString = key instanceof RegExp ? key.source : key.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
      return new RegExp(`(${regExpString})`);
    }

    for (let [key, chunk] of chunks) {
      switch (key) {
        case "start":
          string = string.replace(/(#version .*?\n(\s*precision highp float;\s)?)([\s\S]*)/, `$1\n${chunk}\n$3`);
          break;
        case "end":
          string = string.replace(/(}\s*$)/, `\n${chunk}\n$1`);
          break;
        case "main":
          string = string.replace(/(\bvoid\b +\bmain\b[\s\S]*?{\s*)/, `$1\n${chunk}\n`);
          break;
        default:
          string = string.replace(key, chunk)
      }
    }

    return string;
  }

  constructor({vertexShader = `#version 300 es
    void main() {
      gl_Position = vec4(0., 0., 0., 1.);
    }
  `, fragmentShader = `#version 300 es
    precision highp float;

    out vec4 fragColor;

    void main() {
      fragColor = vec4(1.);
    }
  `, uniforms = [], vertexShaderChunks = [], fragmentShaderChunks = [], shaders = []} = {}) {
    this.uniforms = new Map();
    this.uniformTypes = new Map();

    this.vertexShader = vertexShader;
    this.fragmentShader = fragmentShader;
    this._vertexShaderChunks = [];
    this._fragmentShaderChunks = [];

    this.add({vertexShaderChunks, fragmentShaderChunks, uniforms});
    
    for (let shader of shaders) {
      this.add(shader);
    }
  }

  add({vertexShaderChunks = [], fragmentShaderChunks = [], uniforms = []} = {}) {
    this.vertexShader = Shader.add(this.vertexShader, vertexShaderChunks);
    this._vertexShaderChunks.push(...vertexShaderChunks);
    this.fragmentShader = Shader.add(this.fragmentShader, fragmentShaderChunks);
    this._fragmentShaderChunks.push(...fragmentShaderChunks);
    for (let [key, value] of uniforms) {
      this.uniforms.set(key, value);
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

  /**
   * Parse shader strings to extract uniforms
   */
  _parseUniforms(string, classes) {
    classes = Object.assign({
      Vector2: class Vector2 extends Float32Array {constructor() {super(2)}},
      Vector3: class Vector3 extends Float32Array {constructor() {super(3)}},
      Vector4: class Vector4 extends Float32Array {constructor() {super(4)}},
      Matrix3: class Matrix3 extends Float32Array {constructor() {super([1, 0, 0, 0, 1, 0, 0, 0, 1])}},
      Matrix4: class Matrix3 extends Float32Array {constructor() {super([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])}},
      Texture: class Texture {},
      TextureCube: class TextureCube {}
    }, classes);

    let regExp = /^\s*uniform (.[^ ]+) (.[^ ;\[\]]+)\[? *(\d+)? *\]?/gm;

    let match;

    while ((match = regExp.exec(string))) {
      let [, glslType, variableName, lengthStr] = match;
      let length = parseInt(lengthStr);

      if (this.uniforms.has(variableName)) {
        continue;
      }

      let value;
      let typeMatch;

      this.uniformTypes.set(variableName, glslType);

      if (/float|double/.test(glslType)) {
        if (isNaN(length)) {
          value = 0;
        } else {
          value = new Array(length).fill(0);
        }
      } else if (/int|uint/.test(glslType)) {
        if (isNaN(length)) {
          value = 0;
        } else {
          value = new Array(length).fill(0);
        }
      } else if (/sampler2D/.test(glslType)) {
        if (isNaN(length)) {
          value = new classes.Texture();
        } else {
          value = new Array(length).fill().map(value => new classes.Texture());
        }
      } else if (/samplerCube/.test(glslType)) {
        if (isNaN(length)) {
          value = new classes.TextureCube();
        } else {
          value = new Array(length).fill().map(value => new classes.TextureCube());
        }
      } else if( (typeMatch = /(.?)vec(\d)/.exec(glslType)) ) {
        let vectorLength = typeMatch[2];
        if (isNaN(length)) {
          value = new classes[`Vector${vectorLength}`]();
        } else {
          value = new Array(length).fill().map(value => new classes[`Vector${vectorLength}`]());
        }
      } else if( (typeMatch = /mat(\d)/.exec(glslType)) ) {
        let matrixLength = typeMatch[1];
        if (isNaN(length)) {
          value = new classes[`Matrix${matrixLength}`]();
        } else {
          value = new Array(length).fill().map(value => new classes[`Matrix${matrixLength}`]());
        }
      } else {
        value = undefined;
      }

      this.uniforms.set(variableName, value);
    }
  }
}
