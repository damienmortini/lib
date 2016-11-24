import { Vector2 as THREEVector2 } from "three/src/math/Vector2.js";
import { Vector3 as THREEVector3 } from "three/src/math/Vector3.js";
import { Vector4 as THREEVector4 } from "three/src/math/Vector4.js";
import { Matrix3 as THREEMatrix3 } from "three/src/math/Matrix3.js";
import { Matrix4 as THREEMatrix4 } from "three/src/math/Matrix4.js";
import { Texture as THREETexture } from "three/src/textures/Texture.js";
import { CubeTexture as THREECubeTexture } from "three/src/textures/CubeTexture.js";

import Shader from "dlib/webgl/Shader.js";

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

    super({vertexShader, fragmentShader, uniforms});
  }

  parseQualifiers() {
    super.parseQualifiers({
      classes: {
        Vector2: THREEVector2,
        Vector3: THREEVector3,
        Vector4: THREEVector4,
        Matrix3: THREEMatrix3,
        Matrix4: THREEMatrix4,
        TextureCube: THREECubeTexture,
        Texture2D: THREETexture
      }
    });

    for (let key in this.uniforms) {
      let uniform = this.uniforms[key];
      if(typeof uniform !== "object" || !uniform.value) {
        this.uniforms[key] = {
          value: uniform
        }
      }
    }
  }
}
