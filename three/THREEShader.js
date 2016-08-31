import { Vector2 as THREEVector2 } from "three/src/math/Vector2.js";
import { Vector3 as THREEVector3 } from "three/src/math/Vector3.js";
import { Vector4 as THREEVector4 } from "three/src/math/Vector4.js";
import { Matrix3 as THREEMatrix3 } from "three/src/math/Matrix3.js";
import { Matrix4 as THREEMatrix4 } from "three/src/math/Matrix4.js";
import { Texture as THREETexture } from "three/src/textures/Texture.js";
import { CubeTexture as THREECubeTexture } from "three/src/textures/CubeTexture.js";

export default class THREEShader {
  constructor({vertexShader, fragmentShader, uniforms, attributes}) {
    this.vertexShader = vertexShader;
    this.fragmentShader = fragmentShader;
    this.uniforms = uniforms;
    this.attributes = attributes;

    this.parseQualifiers();
  }

  /**
   * Parse shader strings to extract uniforms and attributes
   */
  parseQualifiers({constructors} = {}) {

    constructors = Object.assign({
        Vector2: THREEVector2,
        Vector3: THREEVector3,
        Vector4: THREEVector4,
        Matrix3: THREEMatrix3,
        Matrix4: THREEMatrix4,
        TextureCube: THREECubeTexture,
        Texture2D: THREETexture
      , constructors});

    let str = `
      ${this.vertexShader}
      ${this.fragmentShader}
    `;

    let regExp = /(uniform|attribute) (.[^ ]+) (.[^ ;\[\]]+)\[? *(\d+)? *\]?/g;

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
          value = new constructors.Texture2D();
        } else {
          value = new Array(length).fill().map(value => new constructors.Texture2D());
        }
      } else if (/samplerCube/.test(glslType)) {
        if (isNaN(length)) {
          value = new constructors.TextureCube();
        } else {
          value = new Array(length).fill().map(value => new constructors.TextureCube());
        }
      } else if( (typeMatch = /(.?)vec(\d)/.exec(glslType)) ) {
        let vectorLength = typeMatch[2];
        if (isNaN(length)) {
          value = new constructors[`Vector${vectorLength}`]();
        } else {
          value = new Array(length).fill().map(value => new constructors[`Vector${vectorLength}`]());
        }
      } else if( (typeMatch = /mat(\d)/.exec(glslType)) ) {
        let matrixLength = typeMatch[1];
        if (isNaN(length)) {
          value = new constructors[`Matrix${matrixLength}`]();
        } else {
          value = new Array(length).fill().map(value => new constructors[`Matrix${matrixLength}`]());
        }
      } else {
        value = null;
      }

      glslQualifiers[variableName] = {
        value
      };
    }
  }
}
