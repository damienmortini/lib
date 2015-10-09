import THREE from "THREE";

export default class Shader {
  constructor (vertexShader, fragmentShader, uniforms, attributes) {
    this.vertexShader = vertexShader;
    this.fragmentShader = fragmentShader;
    this.uniforms = uniforms;
    this.attributes = attributes;

    this.parseQualifiers();
  }

  /**
   * Parse shader strings to extract uniforms and attributes
   */
  parseQualifiers () {
    let str = `${this.vertexShader}\n${this.fragmentShader}`;
    let regExp = /(uniform|attribute) (.[^ ]+) (.[^ ;\[\]]+)\[? *(\d+)? *\]?/g;

    let match;

    while((match = regExp.exec(str))) {
      let [ , glslQualifier, glslType, variableName, lengthStr] = match;
      let length = parseInt(lengthStr);

      let glslQualifiers = this[`${glslQualifier}s`];
      if(!glslQualifiers) {
        glslQualifiers = this[`${glslQualifier}s`] = {};
      }
      if (glslQualifiers[variableName]) {
        continue;
      }

      let type;
      let value;
      let typeMatch;

      if(/float|double/.test(glslType)) {
        if(isNaN(length)) {
          type = "f";
          value = 0;
        }
        else {
          type = "fv1";
          value = new Array(length).fill(0);
        }
      }
      else if(/int|uint/.test(glslType)) {
        if(isNaN(length)) {
          type = "i";
          value = 0;
        }
        else {
          type = "iv1";
          value = new Array(length).fill(0);
        }
      }
      else if(/sampler2D/.test(glslType)) {
        if(isNaN(length)) {
          type = "t";
          value = new THREE.Texture();
        }
        else {
          type = "tv";
          value = new Array(length).fill().map(v => new THREE.Texture());
        }
      }
      else if(/samplerCube/.test(glslType)) {
        if(isNaN(length)) {
          type = "t";
          value = new THREE.CubeTexture();
        }
        else {
          type = "tv";
          value = new Array(length).fill().map(v => new THREE.CubeTexture());
        }
      }
      else if((typeMatch = /(.?)vec(\d)/.exec(glslType))) {
        let vectorLength = typeMatch[2];
        if(isNaN(length)) {
          type = `v${vectorLength}`;
          value = new THREE[`Vector${vectorLength}`]();
        }
        else {
          type = `v${vectorLength}v`;
          value = new Array(length).fill().map(v => new THREE[`Vector${vectorLength}`]());
        }
      }
      else if((typeMatch = /mat(\d)/.exec(glslType))) {
        let matrixLength = typeMatch[1];
        if(isNaN(length)) {
          type = `m${matrixLength}`;
          value = new THREE[`Matrix${matrixLength}`]();
        }
        else {
          type = `m${matrixLength}v`;
          value = new Array(length).fill().map(v => new THREE[`Matrix${matrixLength}`]());
        }
      }
      else {
        type = glslType;
        value = null;
      }

      glslQualifiers[variableName] = {type, value};
    }
  }
}
