import {
  Vector2,
  Vector3,
  Vector4,
  Matrix3,
  Matrix4,
  Texture,
  CubeTexture
} from "three";

import Shader from "../3d/Shader.js";

export default class THREEShader extends Shader {
  constructor({ vertexShader = `
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    }
  `, fragmentShader = `
    void main() {
      gl_FragColor = vec4(1.);
    }
  `, uniforms, shaders } = {}) {
    super({
      vertexShader,
      fragmentShader,
      uniforms,
      shaders
    });
  }

  add({ vertexShaderChunks = [], fragmentShaderChunks = [], uniforms = [] } = {}) {
    if (!(uniforms instanceof Array || uniforms instanceof Map)) {
      uniforms = Object.entries(uniforms);
    }
    if (!(this.uniforms instanceof Array || this.uniforms instanceof Map)) {
      this.uniforms = Object.entries(this.uniforms);
    }
    super.add({ vertexShaderChunks, fragmentShaderChunks, uniforms });
  }

  _parseUniforms(string) {
    if (!(this.uniforms instanceof Map)) {
      this.uniforms = new Map(Object.entries(this.uniforms));
    }


    super._parseUniforms(string, {
      Vector2,
      Vector3,
      Vector4,
      Matrix3,
      Matrix4,
      TextureCube: CubeTexture,
      Texture2D: Texture
    });


    let uniformsObject = {};

    for (let [key, uniform] of this.uniforms) {
      uniformsObject[key] = {
        value: uniform.value === undefined ? uniform : uniform.value
      };
    }

    this.uniforms = uniformsObject;
  }
}
