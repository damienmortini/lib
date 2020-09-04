import { Mesh, OrthographicCamera, PlaneBufferGeometry, Vector2, DataTexture, RGBAFormat, FloatType, WebGLRenderer, WebGLRenderTarget, Scene, NearestFilter, RGBFormat } from '../../../three/src/Three.js';

import THREEShaderMaterial from '../material/THREEShaderMaterial.js';

const MAX_WIDTH = 2048;

export default class THREEGPGPUSystem {
  constructor({
    data,
    renderer,
    uniforms = {},
    stride = 1,
    fragmentChunks = [],
    format = RGBAFormat,
    debug = false,
  }) {
    this._renderer = renderer;
    this._stride = stride;

    const channels = format === RGBFormat ? 3 : 4;
    const length = data.length / channels;
    this._width = Math.min(length, MAX_WIDTH);
    this._height = Math.ceil(length / MAX_WIDTH);

    const finalData = new Float32Array(this._width * this._height * channels);
    finalData.set(data);
    const dataTexture = new DataTexture(finalData, this._width, this._height, format, FloatType);
    dataTexture.needsUpdate = true;

    if (debug) {
      this._debugRenderer = new WebGLRenderer();
      document.body.appendChild(this._debugRenderer.domElement);
      this._debugRenderer.setSize(this._width, this._height, false);
      this._debugRenderer.domElement.style.position = 'absolute';
      this._debugRenderer.domElement.style.bottom = '0';
      this._debugRenderer.domElement.style.left = '0';
      this._debugRenderer.domElement.style.width = '100%';
      this._debugRenderer.domElement.style.height = '25%';
      this._debugRenderer.domElement.style.imageRendering = 'pixelated';
    }

    this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene = new Scene();

    this._webglRenderTargetIn = new WebGLRenderTarget(this._width, this._height, {
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      format,
      stencilBuffer: false,
      depthBuffer: false,
      type: FloatType,
    });
    this._webglRenderTargetIn.texture.generateMipmaps = false;
    this._webglRenderTargetOut = this._webglRenderTargetIn.clone();

    this._quad = new Mesh(new PlaneBufferGeometry(2, 2), new THREEShaderMaterial({
      uniforms: {
        dataTexture,
        ...uniforms,
      },
      fragment: `
        void main() {
          gl_FragColor = vec4(0.);
        }
      `,
      vertexChunks: [
        ['start',
          'out vec2 vUV;',
        ],
        ['main',
          'vUV = uv;',
        ],
      ],
      fragmentChunks: [
        ...fragmentChunks,
        ...this.dataChunks,
        ['start', 'in vec2 vUV;'],
      ],
    }));
    this.scene.add(this._quad);

    this.update();
  }

  get onBeforeRender() {
    return this._quad.onBeforeRender;
  }

  set onBeforeRender(value) {
    this._quad.onBeforeRender = value;
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

  get dataChunks() {
    let dataChunksString = '\n';
    for (let i = 0; i < this._stride; i++) {
      dataChunksString += `vec4 dataChunk${i + 1} = texture2D(dataTexture, vec2(dataPosition.x + ${i}., dataPosition.y) / (vec2(DATA_TEXTURE_WIDTH, DATA_TEXTURE_HEIGHT) - 1.));\n`;
    }

    return [
      ['start', `
        #define DATA_TEXTURE_WIDTH ${this.width.toFixed(1)}
        #define DATA_TEXTURE_HEIGHT ${this.height.toFixed(1)}

        uniform highp sampler2D dataTexture;
      `],
      ['main', `
        vec2 dataPosition = floor(vUV * (vec2(DATA_TEXTURE_WIDTH, DATA_TEXTURE_HEIGHT) - 1.) + .5);
        float chunkOffset = mod(dataPosition.x, ${this._stride}.);
        dataPosition.x -= chunkOffset;
        ${dataChunksString}
      `],
    ];
  }

  update() {
    const savedRendertarget = this._renderer.getRenderTarget();

    this._renderer.setRenderTarget(this._webglRenderTargetOut);
    this._renderer.render(this.scene, this.camera);

    if (this._debugRenderer) {
      this._debugRenderer.setRenderTarget(this._webglRenderTargetOut);
      this._debugRenderer.render(this.scene, this.camera);
      this._debugRenderer.setRenderTarget(null);
      this._debugRenderer.render(this.scene, this.camera);
    }

    [this._webglRenderTargetIn, this._webglRenderTargetOut] = [this._webglRenderTargetOut, this._webglRenderTargetIn];

    this._quad.material.dataTexture = this._webglRenderTargetIn.texture;

    this._renderer.setRenderTarget(savedRendertarget);
  }
}
