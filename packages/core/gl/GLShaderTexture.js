import GLTexture from './GLTexture.js';
import GLFrameBuffer from './GLFrameBuffer.js';
import GLProgram from './GLProgram.js';
import GLPlaneObject from './object/GLPlaneObject.js';
import Shader from '../3d/Shader.js';

export default class GLShaderTexture extends GLTexture {
  constructor({
    gl,
    width,
    height,
    target = gl.TEXTURE_2D,
    internalFormat = gl.RGBA8 || gl.RGBA,
    format = gl.RGBA,
    type = gl.UNSIGNED_BYTE,
    autoGenerateMipmap = false,
    minFilter = autoGenerateMipmap ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR,
    magFilter = gl.LINEAR,
    wrapS = gl.REPEAT,
    wrapT = gl.REPEAT,
    uniforms = {},
    fragmentChunks = [],
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
      autoGenerateMipmap: false,
    });

    this._autoGenerateMipmap = autoGenerateMipmap;

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
        shader: new Shader({
          uniforms,
          vertexChunks: [
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
          fragmentChunks,
        }),
      }),
    });

    this.draw({ uniforms, debug });
  }

  get program() {
    return this._quad.program;
  }

  draw({ uniforms = {}, debug = false } = {}) {
    this.gl.viewport(0, 0, this.width, this.height);
    this._frameBuffer.bind();
    this._quad.draw({
      uniforms,
    });
    this._frameBuffer.unbind();
    if (debug) {
      if (debug instanceof Array) {
        this.gl.viewport(debug[0], debug[1], debug[2], debug[3]);
      }
      this._quad.draw({
        uniforms,
      });
    }
    if (this._autoGenerateMipmap) {
      this.generateMipmap();
    }
  }
}
