import {
  Mesh,
  Color,
  OrthographicCamera,
  PlaneBufferGeometry,
  Vector2,
  DataTexture,
  RGBAFormat,
  FloatType,
  WebGLRenderer,
  WebGLRenderTarget,
  Scene,
  NearestFilter
} from "../../three/build/three.module.js";

import THREEShaderMaterial from "./THREEShaderMaterial.js";

const MAX_WIDTH = 2048;

export default class THREEGPGPUSystem {
  constructor({
    data,
    renderer,
    uniforms = new Map(),
    size = 1,
    fragmentShaderChunks = [],
    format = RGBAFormat,
    debug = false
  } = {}) {
    this._renderer = renderer;

    const channels = format === RGBAFormat ? 4 : 3;
    const length = data.length / channels;
    this._width = Math.min(length, MAX_WIDTH);
    this._height = Math.ceil(length / MAX_WIDTH);

    const finalData = new Float32Array(this._width * this._height * channels);
    finalData.set(data);
    let dataTexture = new DataTexture(finalData, this._width, this._height, format, FloatType);
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
      format: format,
      stencilBuffer: false,
      depthBuffer: false,
      type: FloatType
    });
    this._webglRenderTargetIn.texture.generateMipmaps = false;
    this._webglRenderTargetOut = this._webglRenderTargetIn.clone();

    const createDataChunks = () => {
      let str = "\n";
      for (let i = 0; i < size; i++) {
        str += `vec4 dataChunk${i} = texture2D(dataTexture, vec2(dataPosition.x + ${i}., dataPosition.y) / dataTextureSize);\n`;
      }
      return str;
    }

    this._quad = new Mesh(new PlaneBufferGeometry(2, 2), new THREEShaderMaterial({
      uniforms: new Map([
        ["dataTextureSize", new Vector2(dataTexture.image.width, dataTexture.image.height)],
        ["dataTexture", dataTexture],
        ...uniforms
      ]),
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
          float chunkOffset = mod(dataPosition.x, ${size}.);
          dataPosition.x -= chunkOffset;
          ${createDataChunks()}
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
    if(this._debugRenderer) {
      this._debugRenderer.render(this.scene, this.camera, this._webglRenderTargetOut);
      this._debugRenderer.render(this.scene, this.camera);
    }
    this._renderer.render(this.scene, this.camera, this._webglRenderTargetOut);
    [this._webglRenderTargetIn, this._webglRenderTargetOut] = [this._webglRenderTargetOut, this._webglRenderTargetIn];
    this._quad.material.dataTexture = this._webglRenderTargetIn.texture;
  }
}
