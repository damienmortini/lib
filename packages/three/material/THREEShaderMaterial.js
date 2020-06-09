import { ShaderMaterial } from '../../../three/src/materials/ShaderMaterial.js';
import { ShaderLib } from '../../../three/src/renderers/shaders/ShaderLib.js';
import { UniformsUtils } from '../../../three/src/renderers/shaders/UniformsUtils.js';
import DEFAULT_VERTEX from '../../../three/src/renderers/shaders/ShaderChunk/default_vertex.glsl.js';
import DEFAULT_FRAGMENT from '../../../three/src/renderers/shaders/ShaderChunk/default_fragment.glsl.js';

import Shader from '../../core/3d/Shader.js';
// import THREEShader from '../shader/THREEShader.js';

const toWebGL1 = (source, type) => {
  source = source.replace(/#version.*?\n/g, '');
  source = source.replace(/\btexture\b/g, 'texture2D');
  if (type === 'vertex') {
    source = source.replace(/(^\s*)\bin\b/gm, '$1attribute');
    source = source.replace(/(^\s*)\bout\b/gm, '$1varying');
  } else {
    source = source.replace(/(^\s*)\bin\b/gm, '$1varying');
    const results = /out vec4 (.*?);/.exec(source);
    if (results) {
      const fragColorName = results[1];
      source = source.replace(/out.*?;/, '');
      source = source.replace(new RegExp(`\\b${fragColorName}\\b`, 'g'), 'gl_FragColor');
    }
  }
  return source;
};

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
      fragmentShader: toWebGL1(shader.fragment, 'fragment'),
      vertexShader: toWebGL1(shader.vertex, 'vertex'),
      uniforms: {
        ...(type ? UniformsUtils.clone(ShaderLib[type].uniforms) : {}),
        ...threeUniforms,
      },
      ...options,
    });

    this.lights = /lambert|phong|standard/.test(type);

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

  clone() {
    const clone = super.clone();
    for (const key of Object.keys(clone.uniforms)) {
      Object.defineProperty(clone, key, {
        configurable: true,
        get: function () {
          return this.uniforms[key].value;
        },
        set: function (value) {
          this.uniforms[key].value = value;
        },
      });
    }
    return clone;
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
