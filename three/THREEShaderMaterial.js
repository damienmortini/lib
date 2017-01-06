import { ShaderMaterial, ShaderLib, UniformsUtils } from "three";

import THREEShader from "./THREEShader.js";

export default class THREEShaderMaterial extends ShaderMaterial {
  constructor (options = {}) {
    let type = options.type || "";
    delete options.type;
    let vertexShaderChunks = options.vertexShaderChunks;
    delete options.vertexShaderChunks;
    let fragmentShaderChunks = options.fragmentShaderChunks;
    delete options.fragmentShaderChunks;
    let uniforms = options.uniforms;
    delete options.uniforms;

    let shader = new THREEShader({
      vertexShader: options.vertexShader || (type ? ShaderLib[type].vertexShader : undefined),
      fragmentShader: options.fragmentShader || (type ? ShaderLib[type].fragmentShader : undefined),
      uniforms: type ? UniformsUtils.clone(ShaderLib[type].uniforms) : undefined
    });

    super(Object.assign({
      fragmentShader: shader.fragmentShader,
      vertexShader: shader.vertexShader,
      uniforms: shader.uniforms
    }, options));

    this._shader = shader;
    this.add({vertexShaderChunks, fragmentShaderChunks, uniforms});

    this.lights = /lambert|phong|standard/.test(type);
  }

  add({vertexShaderChunks, fragmentShaderChunks, uniforms}) {
    this._shader.add({vertexShaderChunks, fragmentShaderChunks, uniforms});

    this.fragmentShader = this._shader.fragmentShader;
    this.vertexShader = this._shader.vertexShader;

    for (let key in this._shader.uniforms) {
      Object.defineProperty(this, key, {
        configurable: true,
        get: function() { return this.uniforms[key].value },
        set: function(value) { this.uniforms[key].value = value }
      });
    }

    this.update();
  }
}
