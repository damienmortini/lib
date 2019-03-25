import GLFrameBuffer from "./GLFrameBuffer.js";
import GLTexture from "./GLTexture.js";
import GLPlaneObject from "./objects/GLPlaneObject.js";
import GLProgram from "./GLProgram.js";

export default class GLGPGPUSystem {
  constructor({
    gl,
    data,
    maxWidth = 1024,
    fragmentShaderChunks = [],
  }) {
    this.gl = gl;

    if (this.gl instanceof WebGLRenderingContext) {
      this.gl.getExtension("OES_texture_float");
    } else {
      this.gl.getExtension("EXT_color_buffer_float");
    }

    const channels = 4;

    const length = data.length / channels;
    this._width = Math.min(length, maxWidth);
    this._height = Math.ceil(length / maxWidth);

    const textureData = new Float32Array(this._width * this._height * channels);
    textureData.set(data);

    this._frameBufferIn = new GLFrameBuffer({
      gl: this.gl,
      colorTextures: [new GLTexture({
        gl: this.gl,
        data: textureData,
        width: this._width,
        height: this._height,
        minFilter: this.gl.NEAREST,
        magFilter: this.gl.NEAREST,
        format: this.gl.RGBA,
        internalFormat: this.gl instanceof WebGLRenderingContext ? this.gl.RGBA : this.gl.RGBA32F,
        type: this.gl.FLOAT,
      })],
    });

    this._frameBufferOut = this._frameBufferIn.clone();
    this._frameBufferOut.colorTextures[0].data = new Float32Array(this._width * this._height * channels);

    this._quad = new GLPlaneObject({
      gl: this.gl,
      width: 2,
      height: 2,
      uvs: true,
      program: new GLProgram({
        gl: this.gl,
        shader: {
          uniforms: {
            dataTexture: this._frameBufferIn.colorTextures[0],
          },
          vertexShaderChunks: [
            ["start", `
              in vec3 position;
              in vec2 uv;

              out vec2 vUV;
            `],
            ["end", `
              gl_Position = vec4(position, 1.);

              vUV = uv;
            `],
          ],
          fragmentShaderChunks: [
            ...fragmentShaderChunks,
            ["start", `
              uniform sampler2D dataTexture;
              in vec2 vUV;
            `],
            ["main", `
              vec4 data = texture(dataTexture, vUV);
            `],
            ["end", `
              fragColor = data;
            `],
          ],
        },
      }),
    });
  }

  get dataTexture() {
    return this._frameBufferIn.colorTextures[0];
  }

  get dataTextureWidth() {
    return this._width;
  }

  get dataTextureHeight() {
    return this._height;
  }

  update() {
    this.gl.viewport(0, 0, this._width, this._height);
    this._frameBufferOut.bind();
    this._quad.draw();
    this._frameBufferOut.unbind();
    this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    [this._frameBufferIn, this._frameBufferOut] = [this._frameBufferOut, this._frameBufferIn];
    this._quad.program.uniforms.set("dataTexture", this.dataTexture);
  }
}
