import THREE from "three";

import { ShaderMaterial, ShaderLib, UniformsUtils } from "three";

import THREEShader from "./THREEShader.js";

export default class THREEExtendedShaderMaterial extends ShaderMaterial {
  constructor (options = {}) {
    let originalShaderName = options.originalShaderName || "basic";
    delete options.originalShaderName;
    let vertexShaderHooks = Object.assign({prefix: "", main: "", suffix: ""}, options.vertexShaderHooks);
    delete options.vertexShaderHooks;
    let fragmentShaderHooks = Object.assign({prefix: "", main: "", suffix: ""}, options.fragmentShaderHooks);
    delete options.fragmentShaderHooks;

    let originalShader = ShaderLib[originalShaderName] || {};
    let tempShader = new THREEShader({vertexShader: vertexShaderHooks.prefix, fragmentShader: fragmentShaderHooks.prefix});

    options.uniforms = Object.assign(UniformsUtils.clone(originalShader.uniforms), tempShader.uniforms, options.uniforms);

    var regExp = /([\s\S]*?\bvoid\b +\bmain\b[\s\S]*?{)([\s\S]*)}/m;

    let generateSubstringFromHooks = (hooks) => {
      return `${hooks.prefix}\n\n$1\n\n${hooks.main}\n\n$2\n\n${hooks.suffix}\n\n}`;
    }

    super(Object.assign({
      vertexShader: originalShader.vertexShader.replace(regExp, generateSubstringFromHooks(vertexShaderHooks)),
      fragmentShader: originalShader.fragmentShader.replace(regExp, generateSubstringFromHooks(fragmentShaderHooks))
    }, options));

    for (let key of ["bumpMap", "displacementMap", "emissiveMap", "envMap", "lightMap", "map", "metalnessMap", "normalMap", "roughnessMap", "specularMap"]) {
      if(this.uniforms[key]) {
        this[key] = this.uniforms[key].value;
      }
    }

    this.lights = /lambert|phong|standard/.test(originalShaderName);
  }
}
