import Matrix4 from "gl-mat4";

import Vector3 from "../../math/Vector3";

import GLSLView from "../../webgl/GLSLView";
import Pointer from "../../input/Pointer";

import SHADER from "./shader.glsl!text";

export default class ShapeMaskView extends GLSLView {
  constructor (canvas, image) {
    super(canvas, SHADER);

    this.image = image;

    this.shapesRatio = [0, 1, 1];

    this.texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.image);
  }

  update(time) {
    this.gl.uniform2f(this.gl.getUniformLocation(this.program, "uResolution"), this.canvas.width, this.canvas.height);
    this.gl.uniform1f(this.gl.getUniformLocation(this.program, "uTime"), time);
    super.update();
  }
}
