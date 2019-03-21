import GLFrameBuffer from "./GLFrameBuffer.js";
import GLTexture from "./GLTexture.js";
import GLPlaneObject from "./objects/GLPlaneObject.js";
import GLProgram from "./GLProgram.js";

export default class GLGPGPUSystem {
  constructor({
    gl,
    data,
    maxWidth = 1024,
    channels = 4,
  }) {
    const length = data.length / channels;
    this._width = Math.min(length, maxWidth);
    this._height = Math.ceil(length / maxWidth);

    // console.log(data);
    

    this._frameBufferIn = new GLFrameBuffer({
      gl,
      colorTextures: [new GLTexture({
        gl,
        // data,
        width: this._width,
        height: this._height,
        minFilter: gl.NEAREST,
        magFilter: gl.NEAREST,
        format: gl.RGBA,
        internalFormat: gl.RGBA32F,
        type: gl.FLOAT,
      })],
    });
    this._frameBufferOut = this._frameBufferIn.clone();

    this._quad = new GLPlaneObject({
      gl,
      width: 1,
      height: 1,
      uvs: true,
      program: new GLProgram({
        gl,
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
            ["start", `
              in vec2 vUV;
            `],
            ["end", `
              fragColor = vec4(vUV, 0., 1.);
            `],
          ],
        },
      }),
    });
  }

  update() {
    this._frameBufferOut.bind();
    this._quad.draw();
    this._frameBufferOut.unbind();
    [this._frameBufferIn, this._frameBufferOut] = [this._frameBufferOut, this._frameBufferIn];
    this._quad.program.uniforms.set("dataTexture", this._frameBufferIn.colorTextures[0]);
  }
}
