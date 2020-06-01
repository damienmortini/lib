import { ShaderMaterial } from '../../../three/src/materials/ShaderMaterial.js';
import { ShaderLib } from '../../../three/src/renderers/shaders/ShaderLib.js';
import { UniformsUtils } from '../../../three/src/renderers/shaders/UniformsUtils.js';
import DEFAULT_VERTEX from '../../../three/src/renderers/shaders/ShaderChunk/default_vertex.glsl.js';
import DEFAULT_FRAGMENT from '../../../three/src/renderers/shaders/ShaderChunk/default_fragment.glsl.js';

import Shader from '../../core/3d/Shader.js';
// import THREEShader from '../shader/THREEShader.js';

export default class THREEShaderMaterial extends ShaderMaterial {
  constructor({
    type = '',
    vertex = undefined,
    fragment = undefined,
    vertexChunks = [],
    fragmentChunks = [],
    uniforms = {},
    ...options
  } = {}) {
    const shader = new Shader({
      vertex: vertex || (type ? ShaderLib[type].vertexShader : DEFAULT_VERTEX),
      fragment: fragment || (type ? ShaderLib[type].fragmentShader : DEFAULT_FRAGMENT),
      uniforms,
      vertexChunks,
      fragmentChunks,
    });

    const threeUniforms = {};
    for (const [key, value] of Object.entries(shader.uniforms)) {
      if (value.value !== undefined) {
        continue;
      }
      threeUniforms[key] = {
        value,
      };
    }

    super({
      fragmentShader: shader.fragment,
      vertexShader: shader.vertex,
      uniforms: {
        ...(type ? UniformsUtils.clone(ShaderLib[type].uniforms) : {}),
        ...threeUniforms,
      },
      ...options,
    });

    this.lights = /lambert|phong|standard/.test(type);

    if (this.envMap) {
      this.envMap = this.envMap;
    }

    for (const key of Object.keys(this.uniforms)) {
      Object.defineProperty(this, key, {
        configurable: true,
        get: function () {
          return this.uniforms[key].value;
        },
        set: function (value) {
          this.uniforms[key].value = value;
        },
      });
    }
  }

  // add({ vertexChunks, fragmentChunks, uniforms }) {
  //   this._shader.add({ vertexChunks, fragmentChunks, uniforms });

  //   this.fragmentShader = this._shader.fragmentShader;
  //   this.vertexShader = this._shader.vertexShader;

  //   for (const name in this._shader.uniforms) {
  //     const key = name; // Firefox fix
  //     this.uniforms[key] = this._shader.uniforms[key];

  //     let setter;
  //     if (key === 'envMap') {
  //       setter = function (value) {
  //         if (value && value.generateMipmaps && value.image) {
  //           this.maxMipLevel = Math.log2(Math.max(value.image.width, value.image.height));
  //         }
  //         this.uniforms[key].value = value;
  //       };
  //     } else {
  //       setter = function (value) {
  //         this.uniforms[key].value = value;
  //       };
  //     }

  //     Object.defineProperty(this, key, {
  //       configurable: true,
  //       get: function () {
  //         return this.uniforms[key].value;
  //       },
  //       set: setter,
  //     });
  //   }

  //   // if (["boneTexture", "boneTextureSize"].includes(key)) {
  //   //   continue;
  //   // }

  //   delete this.uniforms.boneTexture;
  //   delete this.uniforms.boneTextureSize;
  //   delete this.uniforms.bindMatrix;
  //   delete this.uniforms.bindMatrixInverse;

  //   this.needsUpdate = true;
  // }
}
