import GLTexture from './GLTexture.js';
import GLFrameBuffer from './GLFrameBuffer.js';
import GLProgram from './GLProgram.js';
import GLPlaneObject from './objects/GLPlaneObject.js';

export default class GLShaderTexture extends GLTexture {
  constructor({
    gl,
    width,
    height,
    target = gl.TEXTURE_2D,
    internalFormat = gl.RGBA8 || gl.RGBA,
    format = gl.RGBA,
    type = gl.UNSIGNED_BYTE,
    minFilter = gl.LINEAR,
    magFilter = gl.LINEAR,
    wrapS = gl.REPEAT,
    wrapT = gl.REPEAT,
    generateMipmap = false,
    uniforms = {},
    fragmentShaderChunks = [],
    debug = false,
  }) {
    super({
      gl,
      width,
      height,
      target,
      internalFormat,
      format,
      type,
      minFilter,
      magFilter,
      wrapS,
      wrapT,
      generateMipmap,
    });

    this._frameBuffer = new GLFrameBuffer({
      gl: this.gl,
      colorTextures: [this],
    });

    this._quad = new GLPlaneObject({
      gl: this.gl,
      width: 2,
      height: 2,
      uvs: true,
      program: new GLProgram({
        gl: this.gl,
        shader: {
          uniforms,
          vertexShaderChunks: [
            ['start', `
              in vec3 position;
              in vec2 uv;

              out vec2 vUV;
            `],
            ['end', `
              gl_Position = vec4(position, 1.);
              vUV = uv;
            `],
          ],
          fragmentShaderChunks,
        },
      }),
    });

    this.update({ uniforms, debug });
  }

  update({ uniforms = {}, debug = false } = {}) {
    const previousViewport = this.gl.getParameter(this.gl.VIEWPORT);
    this.gl.viewport(0, 0, this.width, this.height);
    this._frameBuffer.bind();
    this._quad.draw({
      uniforms,
    });
    this._frameBuffer.unbind();
    if (debug) {
      this._quad.draw({
        uniforms,
      });
    }
    this.gl.viewport(...previousViewport);
  }
}
