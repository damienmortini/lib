import Camera from "dlib/3d/Camera.js";
import CameraGLSL from "dlib/shaders/CameraGLSL.js";

export default class WebGLCamera extends Camera {
  static get vertexShaderChunks() {
    return [["start", CameraGLSL.structure()]];
  }
  
  constructor({near, far, aspect, fov} = {}) {
    super({near, far, aspect, fov});
  }
}
