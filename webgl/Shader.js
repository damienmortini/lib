import Vector2 from "dlib/math/Vector2.js";
import Vector3 from "dlib/math/Vector3.js";
import Vector4 from "dlib/math/Vector4.js";
import Matrix3 from "dlib/math/Matrix3.js";
import Matrix4 from "dlib/math/Matrix4.js";
import Texture2D from "./Texture2D.js";
import TextureCube from "./TextureCube.js";

export default class Shader {
  static add(shader = "void main() {}", chunks) {
    function regExpFromKey(key) {
      let regExpString = key instanceof RegExp ? key.source : key.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
      return new RegExp(`(${regExpString})`);
    }

    for (let [key, chunk] of chunks) {
      switch (key) {
        case "start":
            shader = `${chunk}\n${shader}`;
          break;
        case "end":
            shader = shader.replace(/(}\s*$)/, `\n${chunk}\n$1`);
          break;
        case "main":
            shader = shader.replace(/(\bvoid\b +\bmain\b[\s\S]*?{\s*)/, `$1\n${chunk}\n`);
          break;
        default:
          shader = shader.replace(key, chunk)
      }
    }

    return shader;
  }

  constructor({vertexShader = `
    void main() {
      gl_Position = vec4(0.);
    }
  `, fragmentShader = `
    void main() {
      gl_FragColor = vec4(1.);
    }
  `, uniforms = {}, attributes = {}} = {}) {

    this.vertexShader = vertexShader;
    this.fragmentShader = fragmentShader;
    this.uniforms = uniforms;
    this.attributes = attributes;

    this.parseQualifiers();
  }

  add({vertexShaderChunks = new Map(), fragmentShaderChunks = new Map(), uniforms = {}, attributes = {}} = {}) {
    this.vertexShader = Shader.add(this.vertexShader, vertexShaderChunks);
    this.fragmentShader = Shader.add(this.fragmentShader, fragmentShaderChunks);
    Object.assign(this.uniforms, uniforms);
    Object.assign(this.attributes, attributes);
    this.parseQualifiers();
  }

  /**
   * Parse shader strings to extract uniforms and attributes
   */
  parseQualifiers({classes} = {}) {
    classes = Object.assign({
        Vector2,
        Vector3,
        Vector4,
        Matrix3,
        Matrix4,
        TextureCube,
        Texture2D
      }, classes);

    let str = `
      ${this.vertexShader}
      ${this.fragmentShader}
    `;

    let regExp = /^\s*(uniform|attribute) (.[^ ]+) (.[^ ;\[\]]+)\[? *(\d+)? *\]?/gm;

    let match;

    while ((match = regExp.exec(str))) {
      let [, glslQualifier, glslType, variableName, lengthStr] = match;
      let length = parseInt(lengthStr);

      let glslQualifiers = this[`${glslQualifier}s`];
      if (!glslQualifiers) {
        glslQualifiers = this[`${glslQualifier}s`] = {};
      }
      if (glslQualifiers[variableName]) {
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

      glslQualifiers[variableName] = value;
    }
  }
}
