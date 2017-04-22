import Framebuffer from "./Framebuffer.js";
import Texture2D from "./Texture2D.js";

import GLTextureCube from "gl-texture-cube";

export default class TextureCube extends GLTextureCube {
  constructor(gl, sources, format = gl.RGBA, type = gl.UNSIGNED_BYTE) {
    let tmpSources = sources;
    let useCopyTexture = sources[0] instanceof Texture2D || sources[0] instanceof Framebuffer;

    if(useCopyTexture) {
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

    if(useCopyTexture) {
      for (let [i, target] of [
        gl.TEXTURE_CUBE_MAP_POSITIVE_X,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
      ].entries()) {
        sources[i].bind();
        gl.copyTexImage2D(target, 0, format, 0, 0, sources[i].width * .5, sources[i].height * .5, 0);
      }
    }
  }
}
