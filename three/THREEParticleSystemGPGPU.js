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

export default class THREEParticleSystemGPGPU {
  constructor(particles, renderer, {
    uniforms = {},
    vertexShaderChunks = new Map(),
    fragmentShaderChunks = new Map(),
    debug = false
  } = {}) {

    this._renderer = renderer;

    let data = new Float32Array(particles.length * 2 * 4);
    for (let [i, particle] of particles.entries()) {
      data[i * 8] = particle.x;
      data[i * 8 + 1] = particle.y;
      data[i * 8 + 2] = particle.z;
      data[i * 8 + 3] = particle.life;
      data[i * 8 + 4] = particle.velocity.x;
      data[i * 8 + 5] = particle.velocity.y;
      data[i * 8 + 6] = particle.velocity.z;
    }

    this._width = Math.min(particles.length * 2, 2048);
    this._height = Math.min(Math.floor(particles.length * 2 / 2048), 2048);
    let dataTexture = new DataTexture(data, this._width, this._height, RGBAFormat, FloatType);
    dataTexture.needsUpdate = true;

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
      uniforms: {
        dataTextureSize: new Vector2(dataTexture.image.width, dataTexture.image.height),
        dataTexture: dataTexture
      },
      vertexShaderChunks: new Map([
        ["start",
          `varying vec2 vUv;`
        ],
        ["main",
          `vUv = uv;`
        ]
      ]),
      fragmentShaderChunks: new Map([
        ["start", `
          uniform sampler2D dataTexture;
          uniform vec2 dataTextureSize;
          varying vec2 vUv;
        `],
        ["main", `
          float dataPosition = floor(vUv.x * dataTextureSize.x);
          float offset = mod(dataPosition, 2.);
          float dataPositionHead = dataPosition - offset;

          vec4 dataChunk1 = texture2D(dataTexture, vec2(dataPositionHead / (dataTextureSize.x - 1.), 0.));
          vec4 dataChunk2 = texture2D(dataTexture, vec2((dataPositionHead + 1.) / (dataTextureSize.x - 1.), 0.));

          vec3 position = dataChunk1.xyz;
          float life = dataChunk1.w;
          vec3 velocity = dataChunk2.xyz;

          position += velocity;
          life -= 1.;
        `],
        ["end", `
          gl_FragColor = mix(vec4(position, life), vec4(velocity, 0.), offset);
        `]
      ])
    }));
    this.scene.add(this._quad);

    this.update();
  }

  get dataTexture() {
    return this._quad.material.dataTexture;
  }

  update() {
    this._renderer.render(this.scene, this.camera, this._webglRenderTargetOut);
    [this._webglRenderTargetIn, this._webglRenderTargetOut] = [this._webglRenderTargetOut, this._webglRenderTargetIn];
    this._quad.material.dataTexture = this._webglRenderTargetIn.texture;
  }
}
