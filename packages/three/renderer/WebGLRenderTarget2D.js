import { Mesh, OrthographicCamera, PlaneGeometry, Scene, WebGLRenderTarget } from 'three';

export class WebGLRenderTarget2D extends WebGLRenderTarget {
  #scene;
  #camera;
  #quad;

  constructor({
    renderer,
    material = undefined,
    width = 1024,
    height = 1024,
    wrapS = undefined,
    wrapT = undefined,
    magFilter = undefined,
    minFilter = undefined,
    format = undefined,
    type = undefined,
    anisotropy = undefined,
    encoding = undefined,
    generateMipmaps = undefined,
    depthBuffer = undefined,
    stencilBuffer = undefined,
    depthTexture = undefined,
  }) {
    super(width, height, {
      wrapS,
      wrapT,
      magFilter,
      minFilter,
      format,
      type,
      anisotropy,
      encoding,
      generateMipmaps,
      depthBuffer,
      stencilBuffer,
      depthTexture,
    });

    this.renderer = renderer;

    this.#scene = new Scene();
    this.#camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.#quad = new Mesh(new PlaneGeometry(2, 2), material);
    this.#scene.add(this.#quad);
  }

  get material() {
    return this.#quad.material;
  }

  set material(value) {
    this.#quad.material = value;
  }

  render({ debug = false } = {}) {
    if (!debug) this.renderer.setRenderTarget(this);
    this.renderer.render(this.#scene, this.#camera);
    this.renderer.setRenderTarget(null);
  }
}
