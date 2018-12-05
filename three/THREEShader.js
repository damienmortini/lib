import {
  Vector2,
  Vector3,
  Vector4,
  Matrix3,
  Matrix4,
  Texture,
  CubeTexture,
} from "../../three/build/three.module.js";

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
      shaders,
      dataTypeConctructors: {
        Vector2: Vector2,
        Vector3: Vector3,
        Vector4: Vector4,
        Matrix3: Matrix3,
        Matrix4: Matrix4,
        Texture: Texture,
        TextureCube: CubeTexture
      }
    });
  }

  add({ vertexShaderChunks = [], fragmentShaderChunks = [], uniforms = [] } = {}) {
    if (!(uniforms instanceof Array || uniforms instanceof Map)) {
      const uniformObject = uniforms;
      uniforms = new Map();
      for (let key in uniformObject) {
        uniforms.set(key, uniformObject[key].value !== undefined ? uniformObject[key].value : uniformObject[key]);
      }
    }
    if (!(this.uniforms instanceof Array || this.uniforms instanceof Map)) {
      const uniformObject = this.uniforms;
      this.uniforms = new Map();
      for (let key in uniformObject) {
        this.uniforms.set(key, uniformObject[key].value !== undefined ? uniformObject[key].value : uniformObject[key]);
      }
    }
    super.add({ vertexShaderChunks, fragmentShaderChunks, uniforms });

    const uniformsObject = {};
    for (let [key, uniform] of this.uniforms) {
      uniformsObject[key] = {
        value: uniform
      };
    }
    this.uniforms = uniformsObject;
  }
}
