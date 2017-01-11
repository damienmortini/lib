import {
  Object3D,
  Mesh,
  Color,
  PlaneGeometry,
  Texture,
  OrthographicCamera,
  PlaneBufferGeometry,
  Vector2,
  DataTexture,
  RGBAFormat,
  FloatType,
  WebGLRenderer,
  WebGLRenderTarget,
  Scene,
  DoubleSide,
  RepeatWrapping,
  NearestFilter
} from "three";

import THREEExtendedShaderMaterial from "./THREEExtendedShaderMaterial.js";

const MAX_WIDTH = 2048;

export default class THREEParticleSystemGPGPU {
  constructor(particles, renderer, {
    uniforms = {},
    fragmentShaderChunks = [],
    debug = false
  } = {}) {

    this._renderer = renderer;

    let powerOfTwoCeil = (value) => {
      return Math.pow(2, Math.ceil(Math.log(value)/Math.log(2)));
    }

    this._width = Math.min(particles.length * 2, MAX_WIDTH);
    this._width = powerOfTwoCeil(this._width);
    this._height = Math.ceil(particles.length * 2 / MAX_WIDTH);
    this._height = powerOfTwoCeil(this._height);

    let data = new Float32Array(this._width * this._height * 4);
    for (let [i, particle] of particles.entries()) {
      data[i * 8] = particle.x;
      data[i * 8 + 1] = particle.y;
      data[i * 8 + 2] = particle.z;
      data[i * 8 + 3] = particle.life;
      data[i * 8 + 4] = particle.velocity.x;
      data[i * 8 + 5] = particle.velocity.y;
      data[i * 8 + 6] = particle.velocity.z;
      data[i * 8 + 7] = i;
    }
    let dataTexture = new DataTexture(data, this._width, this._height, RGBAFormat, FloatType);
    dataTexture.needsUpdate = true;

    if(debug) {
      this._debugRenderer = new WebGLRenderer();
      document.body.appendChild(this._debugRenderer.domElement);
      this._debugRenderer.setSize(this._width, this._height, false);
      this._debugRenderer.domElement.style.position = "absolute";
      this._debugRenderer.domElement.style.bottom = "0";
      this._debugRenderer.domElement.style.left = "0";
      this._debugRenderer.domElement.style.width = "100%";
      this._debugRenderer.domElement.style.height = "25%";
      this._debugRenderer.domElement.style.imageRendering = "pixelated";
    }

    this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene = new Scene();

    this._webglRenderTargetIn = new WebGLRenderTarget(dataTexture.image.width, dataTexture.image.height, {
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      format: RGBAFormat,
      stencilBuffer: false,
      depthBuffer: false,
      type: FloatType
    });
    this._webglRenderTargetIn.texture.generateMipmaps = false;
    this._webglRenderTargetOut = this._webglRenderTargetIn.clone();

    this._quad = new Mesh(new PlaneBufferGeometry(2, 2), new THREEExtendedShaderMaterial({
      uniforms: Object.assign({
        dataTextureSize: new Vector2(dataTexture.image.width, dataTexture.image.height),
        dataTexture: dataTexture
      }, uniforms),
      vertexShaderChunks: [
        ["start",
          `varying vec2 vUv;`
        ],
        ["main",
          `vUv = uv;`
        ]
      ],
      fragmentShaderChunks: [
        ...fragmentShaderChunks,
        ["start", `
          uniform sampler2D dataTexture;
          uniform vec2 dataTextureSize;
          varying vec2 vUv;
        `],
        ["main", `
          vec2 dataPosition = floor(vUv * dataTextureSize);
          float offset = mod(dataPosition.x, 2.);
          dataPosition.x -= offset;

          vec4 dataChunk1 = texture2D(dataTexture, dataPosition / dataTextureSize);
          vec4 dataChunk2 = texture2D(dataTexture, vec2(dataPosition.x + 1., dataPosition.y) / dataTextureSize);

          vec3 position = dataChunk1.xyz;
          float life = dataChunk1.w;
          vec3 velocity = dataChunk2.xyz;
          float id = dataChunk2.w;
        `],
        ["end", `
          position += velocity;
          life -= 1.;
          gl_FragColor = mix(vec4(position, life), vec4(velocity, 0.), offset);
        `]
      ]
    }));
    this.scene.add(this._quad);

    this.update();
  }

  get material() {
    return this._quad.material;
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  get dataTexture() {
    return this._quad.material.dataTexture;
  }

  update() {
    this._renderer.render(this.scene, this.camera, this._webglRenderTargetOut);
    if(this._debugRenderer) {
      this._debugRenderer.render(this.scene, this.camera);
    }
    [this._webglRenderTargetIn, this._webglRenderTargetOut] = [this._webglRenderTargetOut, this._webglRenderTargetIn];
    this._quad.material.dataTexture = this._webglRenderTargetIn.texture;
  }
}
