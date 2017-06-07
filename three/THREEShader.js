import { Vector2 as THREEVector2, Vector3 as THREEVector3, Vector4 as THREEVector4, Matrix3 as THREEMatrix3, Matrix4 as THREEMatrix4, Texture as THREETexture, CubeTexture as THREECubeTexture } from "three";

import Shader from "dlib/3d/Shader.js";

export default class THREEShader extends Shader {
  constructor({vertexShader = `
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    }
  `, fragmentShader = `
    void main() {
      gl_FragColor = vec4(1.);
    }
  `, uniforms, shaders} = {}) {
    super({
      vertexShader,
      fragmentShader,
      uniforms,
      shaders
    });
  }

  add({vertexShaderChunks = [], fragmentShaderChunks = [], uniforms = []} = {}) {
    if(!(uniforms instanceof Array || uniforms instanceof Map)) {
      uniforms = Object.entries(uniforms);
    }
    if(!(this.uniforms instanceof Array || this.uniforms instanceof Map)) {
      this.uniforms = Object.entries(this.uniforms);
    }
    super.add({vertexShaderChunks, fragmentShaderChunks, uniforms});
  }

  _parseUniforms(string) {
    if(!(this.uniforms instanceof Map)) {
      this.uniforms = new Map(Object.entries(this.uniforms));
    }
    

    super._parseUniforms(string, {
      Vector2: THREEVector2,
      Vector3: THREEVector3,
      Vector4: THREEVector4,
      Matrix3: THREEMatrix3,
      Matrix4: THREEMatrix4,
      TextureCube: THREECubeTexture,
      Texture2D: THREETexture
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
