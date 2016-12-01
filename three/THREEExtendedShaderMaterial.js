import { ShaderMaterial, ShaderLib, UniformsUtils } from "three";

import THREEShader from "./THREEShader.js";

export default class THREEExtendedShaderMaterial extends ShaderMaterial {
  constructor (options = {}) {
    let type = options.type || "";
    delete options.type;
    let vertexShaderChunks = options.vertexShaderChunks;
    delete options.vertexShaderChunks;
    let fragmentShaderChunks = options.fragmentShaderChunks;
    delete options.fragmentShaderChunks;
    let uniforms = options.uniforms;
    delete options.uniforms;

    let shader = new THREEShader(ShaderLib[type] ? {
      vertexShader: ShaderLib[type].vertexShader,
      fragmentShader: ShaderLib[type].fragmentShader,
      uniforms: UniformsUtils.clone(ShaderLib[type].uniforms)
    } : {});

    super(Object.assign({
      fragmentShader: shader.fragmentShader,
      vertexShader: shader.vertexShader,
      uniforms: shader.uniforms
    }, options));

    this.shader = shader;
    this.add({vertexShaderChunks, fragmentShaderChunks, uniforms});

    this.lights = /lambert|phong|standard/.test(type);
  }

  add({vertexShaderChunks, fragmentShaderChunks, uniforms}) {
    this.shader.add({vertexShaderChunks, fragmentShaderChunks, uniforms});

    this.fragmentShader = this.shader.fragmentShader;
    this.vertexShader = this.shader.vertexShader;

    for (let key in this.shader.uniforms) {
      Object.defineProperty(this, key, {
        configurable: true,
        get: function() { return this.uniforms[key].value },
        set: function(value) { this.uniforms[key].value = value }
      });
    }

    this.needsUpdate = true;
  }
}
