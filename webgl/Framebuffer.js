import createFBO from "gl-fbo";

import Texture2D from "./Texture2D.js";

export default class Framebuffer {
  constructor(gl, width, height, {useFloat = false, buffersNumber = 1, depth = true, stencil = false} = {}) {
    let options = {
      float: useFloat,
      color: buffersNumber,
      depth,
      stencil
    };
    this._stackglFramebuffer = createFBO(gl, [width, height], options);

    for (let i = 0; i < this._stackglFramebuffer.color.length; i++) {
      let color = this._stackglFramebuffer.color[i];
      let texture = new Texture2D(gl, color.width, color.height, color.format, color.type);
      texture._stackglTexture2D.handle = color.handle;
      texture.magFilter = color.magFilter;
      texture.minFilter = color.minFilter;
      texture.mipSamples = color.mipSamples;
      this._stackglFramebuffer.color[i] = texture;
    }
  }

  get gl() {
    return this.stackglTexture2D.gl;
  }

  get webGLFramebuffer() {
    return this._stackglFramebuffer.handle;
  }

  get width() {
    return this._stackglFramebuffer.width;
  }

  set width(value) {
    for (let color of this.colors) {
      color.width = value;
    }
    if(this.depth) {
      this.depth.width = value;
    }
    this._stackglFramebuffer.shape = [value, this.height];
  }

  get height() {
    return this._stackglFramebuffer.height;
  }

  set height(value) {
    for (let color of this.colors) {
      color.height = value;
    }
    if(this.depth) {
      this.depth.height = value;
    }
    this._stackglFramebuffer.shape = [this.width, value];
  }

  get colors() {
    return this._stackglFramebuffer.color;
  }

  get depth() {
    return this._stackglFramebuffer.depth;
  }

  bind() {
    this._stackglFramebuffer.bind();
  }

  dispose() {
    this._stackglFramebuffer.dispose();
  }
};
