import { WebGLRenderer, WebGLRenderTarget, Scene, OrthographicCamera, Mesh, PlaneBufferGeometry, RGBAFormat, LinearFilter, DepthTexture, UnsignedShortType } from "three";

export default class THREERenderer extends WebGLRenderer {
  constructor(options) {
    super(options);

    this.filters = [];

    this.renderTargetIn = new WebGLRenderTarget(this.domElement.width, this.domElement.height, {
      format: RGBAFormat,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      stencilBuffer: false
    });
    this.renderTargetIn.texture.generateMipmaps = false;

    this.renderTargetOut = this.renderTargetIn.clone();
    this.renderTargetOut.texture.generateMipmaps = false;

    if(this.context.getExtension("WEBGL_depth_texture")) {
      this.renderTargetIn.depthTexture = new DepthTexture();
      this.renderTargetIn.depthTexture.type = UnsignedShortType;
      this.renderTargetOut.depthTexture = new DepthTexture();
      this.renderTargetOut.depthTexture.type = UnsignedShortType;
    }

    this.scene = new Scene();
    this.scene.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this._quad = new Mesh(new PlaneBufferGeometry(2, 2));
    this._quad.frustumCulled = false;
    this.scene.add(this._quad);

    // Fix to make WebGLRenderer.render extendable
    this._render = this.render;
    delete this.render;
  }

  applyFilter(filter, renderTarget) {
    this._quad.material = filter;
    if (filter.renderTargetTexture) {
      filter.renderTargetTexture = this.renderTargetIn.texture;
    }
    if (filter.renderTargetDepthTexture && this.renderTargetIn.depthTexture) {
      filter.renderTargetDepthTexture = this.renderTargetIn.depthTexture;
    }
    this._render(this.scene, this.scene.camera, renderTarget);
    [this.renderTargetIn, this.renderTargetOut] = [this.renderTargetOut, this.renderTargetIn];
  }

  resize(width, height) {
    this.setSize(width, height, false);
    this.renderTargetIn.setSize(width, height);
    this.renderTargetOut.setSize(width, height);
  }

  render({scene, camera, filters = this.filters, renderTarget, viewport, scissor = viewport} = {}) {
    if(viewport || scissor) {
      if(viewport) {
        this.setViewport(viewport[0], viewport[1], viewport[2], viewport[3]);
      }
      this.setScissor(scissor[0], scissor[1], scissor[2], scissor[3]);
      this.setScissorTest(true);
    } else {
      this.setScissor(0, 0, this.domElement.width, this.domElement.height);
      this.setViewport(0, 0, this.domElement.width, this.domElement.height);
      this.setScissorTest(false);
    }
    if(scene) {
      camera = camera || scene.camera;
      this._render(scene, camera, filters.length ? this.renderTargetIn : renderTarget);
    }
    for (let [i, filter] of filters.entries()) {
      this.applyFilter(filter, i < filters.length - 1 ? this.renderTargetOut : renderTarget);
    }
    if(renderTarget === this.renderTargetOut) {
      [this.renderTargetIn, this.renderTargetOut] = [this.renderTargetOut, this.renderTargetIn];
    }
  }
}
