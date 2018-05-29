import THREEShader from "./THREEShader.js";

export default class THREEShaderMaterial extends THREE.ShaderMaterial {
  constructor(options = {}) {
    let type = options.type || "";
    let vertexShaderChunks = options.vertexShaderChunks;
    let fragmentShaderChunks = options.fragmentShaderChunks;
    let uniforms = options.uniforms;
    let shaders = options.shaders || [];

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

    let shader = new THREEShader({
      vertexShader: options.vertexShader || (type ? THREE.ShaderLib[type].vertexShader : undefined),
      fragmentShader: options.fragmentShader || (type ? THREE.ShaderLib[type].fragmentShader : undefined),
      uniforms: type ? THREE.UniformsUtils.clone(THREE.ShaderLib[type].uniforms) : undefined
    });

    super(Object.assign({
      fragmentShader: shader.fragmentShader,
      vertexShader: shader.vertexShader,
      uniforms: shader.uniforms
    }, options));

    this.defines = { [type.toUpperCase()]: "" };

    this._shader = shader;
    this.add({ vertexShaderChunks, fragmentShaderChunks, uniforms });

    for (let shader of shaders) {
      this.add(shader);
    }

    this.lights = /lambert|phong|standard/.test(type);

    if(this.envMap) {
      this.envMap = this.envMap;
    }
  }

  add({ vertexShaderChunks, fragmentShaderChunks, uniforms }) {
    this._shader.add({ vertexShaderChunks, fragmentShaderChunks, uniforms });

    this.fragmentShader = this._shader.fragmentShader;
    this.vertexShader = this._shader.vertexShader;

    for (let name in this._shader.uniforms) {
      let key = name; // Firefox fix
      this.uniforms[key] = this._shader.uniforms[key];

      let setter;
      if(key === "envMap") {
        setter = function (value) {
          if (value && value.generateMipmaps && value.image) {
            this.maxMipLevel = Math.log2(Math.max(value.image.width, value.image.height));
          }
          this.uniforms[key].value = value;
        }
      } else {
        setter = function (value) {
          this.uniforms[key].value = value;
        }
      }

      Object.defineProperty(this, key, {
        configurable: true,
        get: function () {
          return this.uniforms[key].value;
        },
        set: setter
      });
    }

    this.needsUpdate = true;
  }
}
