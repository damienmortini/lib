import { WebGLRenderer, Scene, OrthographicCamera, PerspectiveCamera, MeshBasicMaterial, BoxGeometry, MeshNormalMaterial, Mesh, PlaneBufferGeometry, RGBFormat, NearestFilter, DepthTexture, UnsignedShortType } from "three";

import THREEShader from "dlib/three/THREEShader.js";
import AntialiasGLSL from "dlib/shaders/AntialiasGLSL.js";

export default class THREERenderer extends WebGLRenderer {
  constructor(options) {
    super(options);

    this.filters = [];

    this.renderTargetIn = new WebGLRenderTarget(this.domElement.width, this.domElement.height, {
      format: RGBFormat,
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      stencilBuffer: false,
      depthBuffer: true
    });
    this.renderTargetIn.texture.generateMipmaps = false;
    this.renderTargetIn.depthTexture = new DepthTexture();
    this.renderTargetIn.depthTexture.type = UnsignedShortType;

    this.renderTargetOut = this.renderTargetIn.clone();
    this.renderTargetOut.texture.generateMipmaps = false;
    this.renderTargetOut.depthTexture = new DepthTexture();
    this.renderTargetOut.depthTexture.type = UnsignedShortType;

    this.scene = new Scene();
    this.scene.camera = new OrthographicCamera(-1, 1, 1, -1, -1, 1);
    this._quad = new Mesh(new PlaneBufferGeometry(2, 2));
    this.scene.add(this._quad);

    // Fix to make WebGLRenderer.render extendable
    this._render = this.render;
    delete this.render;
  }

  applyFilter(filter, renderTarget) {
    this._quad.material = filter;
    if (filter.uniforms.texture) {
      filter.uniforms.texture.value = this.renderTargetIn.texture;
    }
    if (filter.uniforms.depthTexture) {
      filter.uniforms.depthTexture.value = this.renderTargetIn.depthTexture;
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
