import createFBO from "gl-fbo";

export default class Framebuffer {
  constructor(gl, width, height, options) {
    this.stackglFramebuffer = createFBO(gl, [width, height], options);
  }

  get width() {
    return this.stackglFramebuffer.shape[0];
  }

  set width(value) {
    this.stackglFramebuffer.shape = [value, this.height];
  }

  get height() {
    return this.stackglFramebuffer.shape[1];
  }

  set height(value) {
    this.stackglFramebuffer.shape = [this.width, value];
  }

  get colors() {
    return this.stackglFramebuffer.color;
  }

  get depth() {
    return this.stackglFramebuffer.depth;
  }

  get webGLFramebuffer() {
    return this.stackglFramebuffer.handle;
  }

  bind() {
    this.stackglFramebuffer.bind();
  }

  dispose() {
    this.stackglFramebuffer.dispose();
  }
};
