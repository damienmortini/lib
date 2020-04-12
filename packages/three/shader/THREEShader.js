import { Vector2 } from '/node_modules/three/src/math/Vector2.js';
import { Vector3 } from '/node_modules/three/src/math/Vector3.js';
import { Vector4 } from '/node_modules/three/src/math/Vector4.js';
import { Matrix3 } from '/node_modules/three/src/math/Matrix3.js';
import { Matrix4 } from '/node_modules/three/src/math/Matrix4.js';
import { Texture } from '/node_modules/three/src/textures/Texture.js';
import { CubeTexture } from '/node_modules/three/src/textures/CubeTexture.js';

import Shader from '../../core/3d/Shader.js';

export default class THREEShader extends Shader {
  constructor({ vertexShader = `
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    }
  `, fragmentShader = `
    void main() {
      gl_FragColor = vec4(1.);
    }
  `, uniforms = {}, shaders = [] } = {}) {
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
        TextureCube: CubeTexture,
      },
    });
  }

  add({ vertexShaderChunks = [], fragmentShaderChunks = [], uniforms = {} } = {}) {
    super.add({ vertexShaderChunks, fragmentShaderChunks, uniforms });

    for (const key in this.uniforms) {
      if (this.uniforms[key] !== undefined && this.uniforms[key].value !== undefined) {
        continue;
      }
      this.uniforms[key] = {
        value: this.uniforms[key],
      };
    }
  }
}
