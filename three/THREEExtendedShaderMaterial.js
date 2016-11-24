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
    shader.add({vertexShaderChunks, fragmentShaderChunks, uniforms});

    super(Object.assign({
      fragmentShader: shader.fragmentShader,
      vertexShader: shader.vertexShader,
      uniforms: shader.uniforms
    }, options));

    for (let key in this.uniforms) {
      Object.defineProperty(this, key, {
        get: function() { return this.uniforms[key].value },
        set: function(value) { this.uniforms[key].value = value }
      });
    }

    this.lights = /lambert|phong|standard/.test(type);
  }
}
