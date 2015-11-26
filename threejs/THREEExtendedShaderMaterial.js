import THREE from "THREE";

import THREEShader from "dlib/threejs/THREEShader.js";

export default class THREEExtendedShaderMaterial extends THREE.ShaderMaterial {
  constructor (originalShaderName, {vertexShaderChunks = {}, fragmentShaderChunks = {}} = {}) {

    vertexShaderChunks = Object.assign({prefix: "", main: "", suffix: ""}, vertexShaderChunks);
    fragmentShaderChunks = Object.assign({prefix: "", main: "", suffix: ""}, fragmentShaderChunks);

    let originalShader = THREE.ShaderLib[originalShaderName];
    let tempShader = new THREEShader(vertexShaderChunks.prefix, fragmentShaderChunks.prefix);

    var regExp = /([\s\S]*?\bvoid\b +\bmain\b[\s\S]*?{)([\s\S]*)}/m;

    let generateSubstringFromChunks = (chunks) => {
      return `${chunks.prefix}\n\n$1\n\n${chunks.main}\n\n$2\n\n${chunks.suffix}\n\n}`
    }

    super({
      uniforms: Object.assign(originalShader.uniforms, tempShader.uniforms),
      vertexShader: originalShader.vertexShader.replace(regExp, generateSubstringFromChunks(vertexShaderChunks)),
      fragmentShader: originalShader.fragmentShader.replace(regExp, generateSubstringFromChunks(fragmentShaderChunks))
    });

    this.lights = /lambert|phong/.test(originalShaderName);
  }
}
