import Framebuffer from "./Framebuffer.js";
import GLTextureCube from "gl-texture-cube";

export default class TextureCube extends GLTextureCube {
  constructor(gl, sources, format = gl.RGBA, type = gl.UNSIGNED_BYTE) {
    let tmpSources = sources;
    let useFramebuffers = sources[0] instanceof Framebuffer;

    if(useFramebuffers) {
      let tmpCanvas = document.createElement("canvas");
      tmpCanvas.width = 1;
      tmpCanvas.height = 1;
      tmpSources = new Array(6).fill(tmpCanvas);
    }
    super(gl, {
      pos: {
        x: tmpSources[0],
        y: tmpSources[1],
        z: tmpSources[2],
      },
      neg: {
        x: tmpSources[3],
        y: tmpSources[4],
        z: tmpSources[5]
      }
    }, format, type);

    if(useFramebuffers) {
      sources[0].bind();
      gl.copyTexImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, format, 0, 0, sources[0].width * .5, sources[0].height * .5, 0);
      sources[1].bind();
      gl.copyTexImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, format, 0, 0, sources[1].width * .5, sources[1].height * .5, 0);
      sources[2].bind();
      gl.copyTexImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, format, 0, 0, sources[2].width * .5, sources[2].height * .5, 0);
      sources[3].bind();
      gl.copyTexImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, format, 0, 0, sources[3].width * .5, sources[3].height * .5, 0);
      sources[4].bind();
      gl.copyTexImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, format, 0, 0, sources[4].width * .5, sources[4].height * .5, 0);
      sources[5].bind();
      gl.copyTexImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, format, 0, 0, sources[5].width * .5, sources[5].height * .5, 0);
    }
  }
}
