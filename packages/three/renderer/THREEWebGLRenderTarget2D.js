import {
  Scene,
  Mesh,
  PlaneBufferGeometry,
  WebGLRenderTarget,
  OrthographicCamera,
} from '../../../three/src/Three.js'

export default class THREEWebGLRenderTarget2D extends WebGLRenderTarget {
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
    })

    this.renderer = renderer

    this._scene = new Scene()
    this._camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)

    this._quad = new Mesh(new PlaneBufferGeometry(2, 2), material)
    this._scene.add(this._quad)
  }

  get material() {
    return this._quad.material
  }

  set material(value) {
    this._quad.material = value
  }

  render({ debug = false } = {}) {
    if (!debug) this.renderer.setRenderTarget(this)
    this.renderer.render(this._scene, this._camera)
    this.renderer.setRenderTarget(null)
  }
}
