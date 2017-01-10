import { WebGLRenderer, WebGLRenderTarget, Scene, OrthographicCamera, Mesh, PlaneBufferGeometry, RGBAFormat, LinearFilter, DepthTexture, UnsignedShortType } from "three";

import THREEShader from "dlib/three/THREEShader.js";
import AntialiasGLSL from "dlib/shaders/AntialiasGLSL.js";

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
    if (filter.texture) {
      filter.texture = this.renderTargetIn.texture;
    }
    if (filter.depthTexture && this.renderTargetIn.depthTexture) {
      filter.depthTexture = this.renderTargetIn.depthTexture;
    }
    this._render(this.scene, this.scene.camera, renderTarget);
    [this.renderTargetIn, this.renderTargetOut] = [this.renderTargetOut, this.renderTargetIn];
  }

  resize(width, height) {
    this.setSize(width, height, false);
    this.renderTargetIn.setSize(width, height);
    this.renderTargetOut.setSize(width, height);
  }

  render(scene, renderTarget) {
    if(!renderTarget && this.filters.length) {
      this._render(scene, scene.camera, this.renderTargetIn);
      for (let [i, filter] of this.filters.entries()) {
        this.applyFilter(filter, i < this.filters.length - 1 ? this.renderTargetOut : undefined);
      }
      this._render(this.scene, this.scene.camera);
    } else {
      this._render(scene, scene.camera, renderTarget);
      if(renderTarget === this.renderTargetOut) {
        [this.renderTargetIn, this.renderTargetOut] = [this.renderTargetOut, this.renderTargetIn];
      }
    }
  }
}
