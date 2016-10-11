import { ShaderMaterial, ShaderLib, UniformsUtils } from "three";

import THREEShader from "./THREEShader.js";

export default class THREEExtendedShaderMaterial extends ShaderMaterial {
  constructor (options = {}) {
    let type = options.type || "";
    delete options.type;
    let vertexShaderHooks = Object.assign({prefix: "", main: "", suffix: "", before: [], after: [], replace: []}, options.vertexShaderHooks);
    delete options.vertexShaderHooks;
    let fragmentShaderHooks = Object.assign({prefix: "", main: "", suffix: "", before: [], after: [], replace: []}, options.fragmentShaderHooks);
    delete options.fragmentShaderHooks;

    let originalShader = ShaderLib[type] || new THREEShader();
    let tempShader = new THREEShader({vertexShader: vertexShaderHooks.prefix, fragmentShader: fragmentShaderHooks.prefix, uniforms: options.uniforms});

    options.uniforms = Object.assign(UniformsUtils.clone(originalShader.uniforms), tempShader.uniforms);

    let insertHooks = (shader, hooks) => {
      shader = shader.replace(
        /([\s\S]*?)(\bvoid\b +\bmain\b[\s\S]*?{)([\s\S]*)}/m,
        `${hooks.prefix ? `\n\n// hook: prefix\n\n${hooks.prefix}\n\n\n` : ""}$1$2${hooks.main ? `\n\n// hook: main\n\n${hooks.main}\n\n\n` : ""}$3\n\n${hooks.suffix ? `\n\n// hook: suffix\n\n${hooks.suffix}\n\n\n` : ""}}`
      );

      function regExpFromKey(key) {
        let regExpString = key instanceof RegExp ? key.source : key.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
        return new RegExp(`([\\s\\S]*?)(${regExpString})([\\s\\S]*)`, "m");
      }

      for (let [key, value] of new Map(hooks.before)) {
        shader = shader.replace(
          regExpFromKey(key),
          `$1\n\n// hook: before\n\n${value}\n\n\n$2$3`
        );
      }

      for (let [key, value] of new Map(hooks.after)) {
        shader = shader.replace(
          regExpFromKey(key),
          `$1$2\n\n// hook: after\n\n${value}\n\n\n$3`
        );
      }

      for (let [key, value] of new Map(hooks.replace)) {
        shader = shader.replace(
          regExpFromKey(key),
          `$1\n\n// hook: replace\n\n${value}\n\n\n$3`
        );
      }

      return shader;
    }

    super(Object.assign({
      vertexShader: insertHooks(originalShader.vertexShader, vertexShaderHooks),
      fragmentShader: insertHooks(originalShader.fragmentShader, fragmentShaderHooks)
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
