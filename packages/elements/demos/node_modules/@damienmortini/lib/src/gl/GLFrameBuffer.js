export default class GLFrameBuffer {
  constructor({
    gl,
    target = gl.FRAMEBUFFER,
    colorTextures = [],
    depthTexture = undefined,
    stencilTexture = undefined,
  }) {
    this.gl = gl;
    this.target = target;

    this._frameBuffer = this.gl.createFramebuffer();

    this.colorTextures = [];
    for (const [i, texture] of colorTextures.entries()) {
      this.attach({
        texture,
        attachment: this.gl.COLOR_ATTACHMENT0 + i,
      });
    }
    if (depthTexture) {
      this.attach({
        texture: depthTexture,
        attachment: this.gl.DEPTH_ATTACHMENT,
      });
    }
    if (stencilTexture) {
      this.attach({
        texture: stencilTexture,
        attachment: this.gl.STENCIL_ATTACHMENT,
      });
    }
  }

  attach({
    texture,
    attachment = this.gl.COLOR_ATTACHMENT0,
    target = this.target,
    textarget = this.gl.TEXTURE_2D,
  }) {
    this.bind({ target });
    if (attachment === this.gl.DEPTH_ATTACHMENT) {
      this.depthTexture = texture;
    } else if (attachment === this.gl.STENCIL_ATTACHMENT) {
      this.stencilTexture = texture;
    } else {
      this.colorTextures[attachment - this.gl.COLOR_ATTACHMENT0] = texture;
    }
    this.gl.framebufferTexture2D(target, attachment, textarget, texture._texture || texture, 0);
    this.unbind({ target });
  }

  bind({
    target = this.target,
  } = {}) {
    this.gl.bindFramebuffer(target, this._frameBuffer);
  }

  unbind({
    target = this.target,
  } = {}) {
    this.gl.bindFramebuffer(target, null);
  }

  clone() {
    return new GLFrameBuffer({
      gl: this.gl,
      target: this.target,
      colorTextures: this.colorTextures.map((value) => value.clone()),
      depthTexture: this.depthTexture ? this.depthTexture.clone() : undefined,
      stencilTexture: this.stencilTexture ? this.stencilTexture.clone() : undefined,
    });
  }
}
