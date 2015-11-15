import THREE from "THREE";

import THREEShader from "dlib/threejs/THREEShader.js";

export default class THREEExtendedShaderMaterial extends THREE.ShaderMaterial {
  constructor (originalShaderName, vertexShaderChunks = ["", ""], fragmentShaderChunks = ["", ""]) {
    let originalShader = THREE.ShaderLib[originalShaderName];
    let tempShader = new THREEShader(vertexShaderChunks[0] + vertexShaderChunks[1], fragmentShaderChunks[0] + fragmentShaderChunks[1]);

    super({
      uniforms: Object.assign(originalShader.uniforms, tempShader.uniforms),
      vertexShader: `${vertexShaderChunks[0]}
        ${originalShader.vertexShader.replace("void main() {", `
          void main() {
            ${vertexShaderChunks[1]}
        `)}
      `,
      fragmentShader: `
        ${fragmentShaderChunks[0]}
        ${originalShader.fragmentShader.slice(0, originalShader.fragmentShader.lastIndexOf("}"))}
        ${fragmentShaderChunks[1]}
        }
      `
    });
    this.lights = /lambert|phong/.test(originalShaderName);
  }
}
