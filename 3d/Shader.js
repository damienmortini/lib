export default class Shader {
  static add(string = "void main() {}", chunks) {
    function regExpFromKey(key) {
      let regExpString = key instanceof RegExp ? key.source : key.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
      return new RegExp(`(${regExpString})`);
    }

    for (let [key, chunk] of chunks) {
      switch (key) {
        case "start":
          string = `${chunk}\n${string}`;
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

  constructor({vertexShader = `
    void main() {
      gl_Position = vec4(0., 0., 0., 1.);
    }
  `, fragmentShader = `
    void main() {
      gl_FragColor = vec4(1.);
    }
  `, uniforms = [], vertexShaderChunks = [], fragmentShaderChunks = [], shaders = []} = {}) {
    this.uniforms = new Map();
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
    this.uniforms = new Map([...this.uniforms, ...uniforms]);
    this.vertexShader = Shader.add(this.vertexShader, vertexShaderChunks);
    this._vertexShaderChunks.push(...vertexShaderChunks);
    this.fragmentShader = Shader.add(this.fragmentShader, fragmentShaderChunks);
    this._fragmentShaderChunks.push(...fragmentShaderChunks);
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
  _parseUniforms(string, {
    Vector2: Vector2 = function() { return new Float32Array(2) },
    Vector3: Vector3 = function() { return new Float32Array(3) },
    Vector4: Vector4 = function() { return new Float32Array(4) },
    Matrix3: Matrix3 = function() { return new Float32Array(9) },
    Matrix4: Matrix4 = function() { return new Float32Array(16) },
    Texture2D: Texture2D = function() {},
    TextureCube: TextureCube = function() {}
  } = {}) {
    let classes = {
      Vector2,
      Vector3,
      Vector4,
      Matrix3,
      Matrix4,
      Texture2D,
      TextureCube
    };

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
          value = new classes.Texture2D();
        } else {
          value = new Array(length).fill().map(value => new classes.Texture2D());
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
        value = null;
      }

      this.uniforms.set(variableName, value);
    }
  }
}
