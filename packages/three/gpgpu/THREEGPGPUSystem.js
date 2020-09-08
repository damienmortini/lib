import { Mesh, OrthographicCamera, PlaneBufferGeometry, DataTexture, RGBAFormat, FloatType, WebGLRenderer, WebGLRenderTarget, Scene, NearestFilter, RGBFormat } from '../../../three/src/Three.js';

import THREEShaderMaterial from '../material/THREEShaderMaterial.js';
import DatatextureShader from '../../core/shader/DataTextureShader.js';

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
    const size = Math.ceil(Math.sqrt(dataSize));
    this._width = size * stride;
    this._height = size;

    this.debug = debug;

    const finalData = new Float32Array(this._width * this._height * channels);
    finalData.set(data);
    const dataTexture = new DataTexture(finalData, this._width, this._height, format, FloatType);
    dataTexture.needsUpdate = true;

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
        ['start', `
          #define DATA_TEXTURE_WIDTH ${this.width.toFixed(1)}
          #define DATA_TEXTURE_HEIGHT ${this.height.toFixed(1)}

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

  // get dataChunks() {
  //   let dataChunksString = '\n';
  //   for (let i = 0; i < this._stride; i++) {
  //     dataChunksString += `vec4 dataChunk${i + 1} = texture2D(dataTexture, vec2(dataPosition.x + ${i}. + .5, dataPosition.y + .5) / vec2(DATA_TEXTURE_WIDTH, DATA_TEXTURE_HEIGHT));\n`;
  //   }

  //   return [
  //     ['start', `
  //       #define DATA_TEXTURE_WIDTH ${this.width.toFixed(1)}
  //       #define DATA_TEXTURE_HEIGHT ${this.height.toFixed(1)}

  //       uniform highp sampler2D dataTexture;
  //     `],
  //     ['main', `
  //       vec2 dataPosition = floor(vUV * vec2(DATA_TEXTURE_WIDTH, DATA_TEXTURE_HEIGHT));
  //       float chunkOffset = mod(dataPosition.x, ${this._stride}.);
  //       dataPosition.x -= chunkOffset;
  //       ${dataChunksString}
  //     `],
  //   ];
  // }

  get stride() {
    return this._stride;
  }

  get debug() {
    return this._debug;
  }

  set debug(value) {
    this._debug = value;
    if (!this._debugRenderer) {
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
    this._debugRenderer.domElement.hidden = !this._debug;
  }

  update() {
    const savedRendertarget = this._renderer.getRenderTarget();

    this._renderer.setRenderTarget(this._webglRenderTargetOut);
    this._renderer.render(this.scene, this.camera);

    if (this.debug) {
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
