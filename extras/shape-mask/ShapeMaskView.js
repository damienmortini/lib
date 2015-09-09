import Matrix4 from "../../math/Matrix4.js";
import Quaternion from "../../math/Quaternion.js";

import GLSLView from "../../webgl/GLSLView.js";

import SHADER from "./shader.glsl!text";

export default class ShapeMaskView extends GLSLView {
  constructor (canvas, image1) {
    super(canvas, SHADER);

    this.shapeRatios = new Float32Array([1, 0, 0, 0, 0, 0, 0, 0]);

    this.matrix = new Matrix4();
    this.quaternion = new Quaternion();

    if(!image1) {
      image1 = document.createElement("canvas");
      image1.width = 1;
      image1.height = 1;
    }

    this.texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.MIRRORED_REPEAT);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.MIRRORED_REPEAT);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);

    this.image1 = image1;
  }

  set image1 (value) {
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, value);
  }

  update(time = 0) {
    this.matrix.fromQuaternion(this.quaternion).invert();

    this.gl.uniform2f(this.gl.getUniformLocation(this.program, "uResolution"), this.canvas.width, this.canvas.height);
    this.gl.uniform1f(this.gl.getUniformLocation(this.program, "uTime"), time);
    this.gl.uniform1fv(this.gl.getUniformLocation(this.program, "uShapeRatios"), this.shapeRatios);
    this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.program, "uMatrixInverse"), false, this.matrix.components);
    super.update();
  }
}
