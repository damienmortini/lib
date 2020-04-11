import { ShaderMaterial } from '../../../three/src/materials/ShaderMaterial.js';
import { ShaderLib } from '../../../three/src/renderers/shaders/ShaderLib.js';
import { UniformsUtils } from '../../../three/src/renderers/shaders/UniformsUtils.js';

import THREEShader from '../shader/THREEShader.js';

export default class THREEShaderMaterial extends ShaderMaterial {
  constructor(options = {}) {
    const type = options.type;
    const vertexShaderChunks = options.vertexShaderChunks;
    const fragmentShaderChunks = options.fragmentShaderChunks;
    const uniforms = options.uniforms;
    const shaders = options.shaders || [];

    options = Object.assign({}, options);
    delete options.type;
    delete options.vertexShaderChunks;
    delete options._vertexShaderChunks;
    delete options._vertexShader;
    delete options.fragmentShaderChunks;
    delete options._fragmentShaderChunks;
    delete options._fragmentShader;
    delete options.uniforms;
    delete options.attributes;
    delete options.shaders;

    const shader = new THREEShader({
      vertexShader: options.vertexShader || (type ? ShaderLib[type].vertexShader : undefined),
      fragmentShader: options.fragmentShader || (type ? ShaderLib[type].fragmentShader : undefined),
      uniforms: type ? UniformsUtils.clone(ShaderLib[type].uniforms) : undefined,
    });

    super(Object.assign({
      fragmentShader: shader.fragmentShader,
      vertexShader: shader.vertexShader,
      uniforms: shader.uniforms,
    }, options));

    this._shader = shader;
    this.add({ vertexShaderChunks, fragmentShaderChunks, uniforms });

    for (const shader of shaders) {
      this.add(shader);
    }

    this.lights = /lambert|phong|standard/.test(type);

    if (this.envMap) {
      this.envMap = this.envMap;
    }
  }

  add({ vertexShaderChunks, fragmentShaderChunks, uniforms }) {
    this._shader.add({ vertexShaderChunks, fragmentShaderChunks, uniforms });

    this.fragmentShader = this._shader.fragmentShader;
    this.vertexShader = this._shader.vertexShader;

    for (const name in this._shader.uniforms) {
      const key = name; // Firefox fix
      this.uniforms[key] = this._shader.uniforms[key];

      let setter;
      if (key === 'envMap') {
        setter = function(value) {
          if (value && value.generateMipmaps && value.image) {
            this.maxMipLevel = Math.log2(Math.max(value.image.width, value.image.height));
          }
          this.uniforms[key].value = value;
        };
      } else {
        setter = function(value) {
          this.uniforms[key].value = value;
        };
      }

      Object.defineProperty(this, key, {
        configurable: true,
        get: function() {
          return this.uniforms[key].value;
        },
        set: setter,
      });
    }

    // if (["boneTexture", "boneTextureSize"].includes(key)) {
    //   continue;
    // }

    delete this.uniforms.boneTexture;
    delete this.uniforms.boneTextureSize;
    delete this.uniforms.bindMatrix;
    delete this.uniforms.bindMatrixInverse;

    this.needsUpdate = true;
  }
}
