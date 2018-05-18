export default class THREERenderer extends THREE.WebGLRenderer {
  constructor(options) {
    super(Object.assign({antialias: true}, options));

    this.filters = [];
    this._renderTargets = new Map();

    let renderTargetIn = new THREE.WebGLRenderTarget(this.domElement.width, this.domElement.height, {
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      stencilBuffer: false
    });
    renderTargetIn.texture.generateMipmaps = false;

    let renderTargetOut = renderTargetIn.clone();
    renderTargetOut.texture.generateMipmaps = false;

    if(this.context.getExtension("WEBGL_depth_texture")) {
      renderTargetIn.depthTexture = new THREE.DepthTexture();
      renderTargetIn.depthTexture.type = THREE.UnsignedShortType;
      renderTargetOut.depthTexture = new THREE.DepthTexture();
      renderTargetOut.depthTexture.type = THREE.UnsignedShortType;
    }

    this._renderTargets.set(this, {
      in: renderTargetIn,
      out: renderTargetOut
    });

    this.scene = new THREE.Scene();
    this.scene.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this._quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2));
    this._quad.frustumCulled = false;
    this.scene.add(this._quad);

    // Fix to make WebGLRenderer.render extendable
    this._render = this.render;
    delete this.render;
  }

  applyFilter(filter, renderTargetIn, renderTargetOut) {
    this._quad.material = filter;
    if (filter.renderTargetTexture) {
      filter.renderTargetTexture = renderTargetIn.texture;
    }
    if (filter.renderTargetDepthTexture && renderTargetIn.depthTexture) {
      filter.renderTargetDepthTexture = renderTargetIn.depthTexture;
    }
    this._render(this.scene, this.scene.camera, renderTargetOut);
  }

  resize(width, height) {
    this.setSize(width, height, false);
    let renderTargets = this._renderTargets.get(this);
    renderTargets.in.setSize(width, height);
    renderTargets.out.setSize(width, height);
  }

  render({scene, camera, filters = this.filters, renderTarget, viewport, scissor = viewport} = {}) {
    if(arguments.length > 1) {
      this._render(...arguments);
      return;
    }
    let renderTargets = this._renderTargets.get(renderTarget || this);
    if(!renderTargets) {
      renderTargets = {
        in: renderTarget.clone(),
        out: renderTarget.clone()
      };
      renderTargets.in.texture.generateMipmaps = false;
      renderTargets.out.texture.generateMipmaps = false;
      this._renderTargets.set(renderTarget, renderTargets);
    }
    if(viewport || scissor) {
      if(viewport) {
        if(renderTarget) {
          renderTarget.viewport.set(viewport[0], viewport[1], viewport[2], viewport[3]);
        } else {
          this.setViewport(viewport[0], viewport[1], viewport[2], viewport[3]);
        }
      }
      if(renderTarget) {
        renderTarget.scissor.set(scissor[0], scissor[1], scissor[2], scissor[3]);
        renderTarget.scissorTest = true;
      } else {
        this.setScissor(scissor[0], scissor[1], scissor[2], scissor[3]);
        this.setScissorTest(true);
      }
    } else {
      if(renderTarget) {
        renderTarget.viewport.set(0, 0, renderTarget.width, renderTarget.height);
        renderTarget.scissor.set(0, 0, renderTarget.width, renderTarget.height);
        renderTarget.scissorTest = false;
      } else {
        this.setViewport(0, 0, this.domElement.width, this.domElement.height);
        this.setScissor(0, 0, this.domElement.width, this.domElement.height);
        this.setScissorTest(false);
      }
    }
    if(scene) {
      camera = camera || scene.camera;
      this._render(scene, camera, filters.length ? renderTargets.in : renderTarget);
    }
    for (let [i, filter] of filters.entries()) {
      this.applyFilter(filter, renderTargets.in, i < filters.length - 1 ? renderTargets.out : renderTarget);
      [renderTargets.in, renderTargets.out] = [renderTargets.out, renderTargets.in];
    }
  }
}
