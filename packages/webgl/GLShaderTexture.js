import { GLFrameBuffer } from './GLFrameBuffer.js';
import { GLProgram } from './GLProgram.js';
import { addChunks } from './GLSLShader.js';
import { GLTexture } from './GLTexture.js';
import { GLPlaneObject } from './object/GLPlaneObject.js';

export class GLShaderTexture extends GLTexture {
  #debug;
  #autoGenerateMipmap;
  #frameBuffer;
  #quad;

  static get VERTEX() {
    return `#version 300 es

    in vec3 position;
    in vec2 uv;
    out vec2 vUV;
    
    void main() {
      gl_Position = vec4(position, 1.);
      vUV = uv;
    }`;
  }

  constructor({
    gl = {}, // Default value to remove when https://github.com/microsoft/vscode/issues/147777 will be resolved,
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

    this.#debug = debug;
    this.#autoGenerateMipmap = autoGenerateMipmap;

    this.#frameBuffer = new GLFrameBuffer({
      gl: this.gl,
      colorTextures: [this],
    });

    this.#quad = new GLPlaneObject({
      gl: this.gl,
      width: 2,
      height: 2,
      uvs: true,
      program: new GLProgram({
        gl: this.gl,
        uniforms,
        vertex: GLShaderTexture.VERTEX,
        fragment: addChunks(
          `#version 300 es
precision highp float;

out vec4 fragColor;

void main() {
  fragColor = vec4(0.);
}`,
          [...fragmentChunks, ['start', `in vec2 vUV;`]],
        ),
      }),
    });

    this.draw({ uniforms, debug });
  }

  get program() {
    return this.#quad.program;
  }

  set program(value) {
    this.#quad.program = value;
  }

  draw({ uniforms = {}, debug = this.#debug } = {}) {
    this.gl.viewport(0, 0, this.width, this.height);
    this.#frameBuffer.bind();
    this.#quad.bind();
    this.#quad.draw({
      uniforms,
    });
    this.#frameBuffer.unbind();
    if (debug) {
      if (debug instanceof Array) this.gl.viewport(debug[0], debug[1], debug[2], debug[3]);
      this.#quad.draw();
    }
    this.#quad.unbind();
    if (this.#autoGenerateMipmap) {
      this.generateMipmap();
    }
  }
}
