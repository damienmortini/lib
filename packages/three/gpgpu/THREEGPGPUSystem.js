import { Mesh, OrthographicCamera, PlaneBufferGeometry, DataTexture, RGBAFormat, FloatType, WebGLRenderer, WebGLRenderTarget, Scene, NearestFilter, RGBFormat, HalfFloatType,MathUtils } from '../../../three/src/Three.js';

import THREEShaderMaterial from '../material/THREEShaderMaterial.js';
import DatatextureShader from '../../core/shader/DataTextureShader.js';
import Float16 from '../../core/math/Float16.js';

let DEBUG_RENDERER;

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
    const dataSize = data.length / channels / stride;
    const width = MathUtils.ceilPowerOfTwo(Math.sqrt(dataSize));
    this._dataTextureWidth = width * stride;
    this._dataTextureHeight = MathUtils.ceilPowerOfTwo(dataSize / width);

    this.debug = debug;

    const finalData = new Float32Array(this._dataTextureWidth * this._dataTextureHeight * channels);
    finalData.set(data);
    let dataTexture;
    // if (renderer.capabilities.isWebGL2) {
      dataTexture = new DataTexture(finalData, this._dataTextureWidth, this._dataTextureHeight, format, FloatType);
    // } else {
      // dataTexture = new DataTexture(Float16.fromFloat32Array(finalData), this._dataTextureWidth, this._dataTextureHeight, format, HalfFloatType);
    // }
    dataTexture.needsUpdate = true;

    this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene = new Scene();

    this._webglRenderTargetIn = new WebGLRenderTarget(this._dataTextureWidth, this._dataTextureHeight, {
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      format,
      stencilBuffer: false,
      depthBuffer: false,
      type: renderer.capabilities.isWebGL2 ? FloatType : HalfFloatType, // Half float for iOS
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
        ['start', `
          #define DATA_TEXTURE_WIDTH ${this.dataTextureWidth.toFixed(1)}
          #define DATA_TEXTURE_HEIGHT ${this.dataTextureHeight.toFixed(1)}

          uniform highp sampler2D dataTexture;
          
          in vec2 vUV;

          ${DatatextureShader.getTextureDataChunkFromUV()}

          vec4 getDataChunk(int chunkIndex) {
            return getTextureDataChunkFromUV(dataTexture, vUV, chunkIndex, ${stride}, vec2(DATA_TEXTURE_WIDTH, DATA_TEXTURE_HEIGHT));
          }

          int getDataIndex() {
            vec2 dataPosition = floor(vUV * vec2(DATA_TEXTURE_WIDTH / float(${stride}), DATA_TEXTURE_HEIGHT));
            return int(dataPosition.x + dataPosition.y * DATA_TEXTURE_WIDTH / float(${stride}));
          }

          int getChunkIndex() {
            return int(mod(vUV * DATA_TEXTURE_WIDTH, float(${stride})));
          }
        `],
      ],
    }));
    this.scene.add(this._quad);
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

  get dataTextureWidth() {
    return this._dataTextureWidth;
  }

  get dataTextureHeight() {
    return this._dataTextureHeight;
  }

  get dataTextureSize() {
    return [this._dataTextureWidth, this._dataTextureHeight];
  }

  get dataTexture() {
    return this._quad.material.dataTexture;
  }

  get stride() {
    return this._stride;
  }

  get debug() {
    return this._debug;
  }

  set debug(value) {
    this._debug = value;
    if (this._debug && !DEBUG_RENDERER) {
      DEBUG_RENDERER = new WebGLRenderer();
      document.body.appendChild(DEBUG_RENDERER.domElement);
      DEBUG_RENDERER.setSize(this._dataTextureWidth, this._dataTextureHeight, false);
      DEBUG_RENDERER.domElement.style.position = 'absolute';
      DEBUG_RENDERER.domElement.style.bottom = '0';
      DEBUG_RENDERER.domElement.style.left = '0';
      DEBUG_RENDERER.domElement.style.width = '100%';
      DEBUG_RENDERER.domElement.style.height = '25%';
      DEBUG_RENDERER.domElement.style.imageRendering = 'pixelated';
    }
    if (DEBUG_RENDERER) {
      DEBUG_RENDERER.domElement.hidden = !this._debug;
    }
  }

  update() {
    const savedRendertarget = this._renderer.getRenderTarget();

    this._renderer.setRenderTarget(this._webglRenderTargetOut);
    this._renderer.render(this.scene, this.camera);

    if (this.debug) {
      DEBUG_RENDERER.setRenderTarget(this._webglRenderTargetOut);
      DEBUG_RENDERER.render(this.scene, this.camera);
      DEBUG_RENDERER.setRenderTarget(null);
      DEBUG_RENDERER.render(this.scene, this.camera);
    }

    [this._webglRenderTargetIn, this._webglRenderTargetOut] = [this._webglRenderTargetOut, this._webglRenderTargetIn];

    this._quad.material.dataTexture = this._webglRenderTargetIn.texture;

    this._renderer.setRenderTarget(savedRendertarget);
  }
}
