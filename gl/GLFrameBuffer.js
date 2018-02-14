export default class GLFrameBuffer {
  constructor({
    gl, 
    target = gl.FRAMEBUFFER,
  }) {
    this.gl = gl;
    this.target = target;

    this.colorTextures = [];
    this.depthTexture = null;
    this.stencilTexture = null;

    this._frameBuffer = this.gl.createFramebuffer();
  }

  attach({
    texture,
    attachment = this.gl.COLOR_ATTACHMENT0,
    target = this.target,
    textarget = this.gl.TEXTURE_2D,
  }) {
    this.bind({target});
    if(attachment === this.gl.DEPTH_ATTACHMENT) {
      this.depthTexture = texture;
    } else if(attachment === this.gl.STENCIL_ATTACHMENT) {
      this.stencilTexture = texture;
    } else {
      this.colorTextures[attachment - this.gl.COLOR_ATTACHMENT0] = texture;
    }
    this.gl.framebufferTexture2D(target, attachment, textarget, texture._texture || texture, 0);
    this.unbind({target});
  }

  bind({
    target = this.target
  } = {}) {
    this.gl.bindFramebuffer(target, this._frameBuffer);
  }

  unbind({
    target = this.target
  } = {}) {
    this.gl.bindFramebuffer(target, null);
  }
};
