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
  `, uniforms = {}} = {}) {

    super({
      vertexShader,
      fragmentShader,
      uniforms
    });
  }

  _parseQualifiers(string) {
    super._parseQualifiers(string, {
      Vector2: THREEVector2,
      Vector3: THREEVector3,
      Vector4: THREEVector4,
      Matrix3: THREEMatrix3,
      Matrix4: THREEMatrix4,
      TextureCube: THREECubeTexture,
      Texture2D: THREETexture
    });

    for (let key in this.uniforms) {
      let uniform = this.uniforms[key];
      if (typeof uniform !== "object" || uniform.value === undefined) {
        this.uniforms[key] = {
          value: uniform
        }
      }
    }
  }
}
