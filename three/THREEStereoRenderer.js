import { WebGLRenderer, StereoCamera } from "three";

export default class THREEStereoRenderer {
  constructor(renderer = new WebGLRenderer()) {
    this.renderer = renderer;

    this._stereoCamera = new StereoCamera();
    this._stereoCamera.aspect = 0.5;
  }

  set eyeOffset(value) {
    this._stereoCamera.eyeSep = value;
  }

  setSize(width, height) {
    this.renderer.setSize(width, height);
  }

  render(scene, camera, renderTarget) {
    scene.updateMatrixWorld();

    if (camera.parent === null) camera.updateMatrixWorld();

    this._stereoCamera.update(camera);

    let size = this.renderer.getSize();

    this.renderer.clear();

    if(renderTarget) {
      renderTarget.scissorTest = true;
      renderTarget.scissor.set(0, 0, size.width * .5, size.height);
      renderTarget.viewport.set(0, 0, size.width * .5, size.height);
    } else {
      this.renderer.setScissorTest(true);
      this.renderer.setScissor(0, 0, size.width * .5, size.height);
      this.renderer.setViewport(0, 0, size.width * .5, size.height);
    }
    this.renderer.render(scene, this._stereoCamera.cameraL, renderTarget);

    if(renderTarget) {
      renderTarget.scissor.set(size.width * .5, 0, size.width * .5, size.height);
      renderTarget.viewport.set(size.width * .5, 0, size.width * .5, size.height);
    } else {
      this.renderer.setScissor(size.width * .5, 0, size.width * .5, size.height);
      this.renderer.setViewport(size.width * .5, 0, size.width * .5, size.height);
    }
    this.renderer.render(scene, this._stereoCamera.cameraR, renderTarget);

    if(renderTarget) {
      renderTarget.scissorTest = false;
      renderTarget.scissor.set(0, 0, size.width, size.height);
      renderTarget.viewport.set(0, 0, size.width, size.height);
    } else {
      this.renderer.setScissorTest(false);
      this.renderer.setScissor(0, 0, size.width, size.height);
      this.renderer.setViewport(0, 0, size.width, size.height);
    }
  }
}
