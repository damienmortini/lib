// From https://github.com/Jam3/glsl-fast-gaussian-blur

import Shader from "../3d/Shader.js";

export default class BlurShader extends Shader {
  static computeBlurTextureCoordinates() {
    return `
      varying vec2 blurTextureCoordinates[15];

      void computeBlurTextureCoordinates(vec2 uv, vec2 distance) {
        blurTextureCoordinates[0] = uv + distance * -.028;
        blurTextureCoordinates[1] = uv + distance * -.024;
        blurTextureCoordinates[2] = uv + distance * -.020;
        blurTextureCoordinates[3] = uv + distance * -.016;
        blurTextureCoordinates[4] = uv + distance * -.012;
        blurTextureCoordinates[5] = uv + distance * -.008;
        blurTextureCoordinates[6] = uv + distance * -.004;
        blurTextureCoordinates[7] = uv;
        blurTextureCoordinates[8] = uv + distance * .004;
        blurTextureCoordinates[9] = uv + distance * .008;
        blurTextureCoordinates[10] = uv + distance * .012;
        blurTextureCoordinates[11] = uv + distance * .016;
        blurTextureCoordinates[12] = uv + distance * .020;
        blurTextureCoordinates[13] = uv + distance * .024;
        blurTextureCoordinates[14] = uv + distance * .028;
      }
    `
  }

  static blur() {
    return `
      varying vec2 blurTextureCoordinates[15];

      vec4 blur(sampler2D texture) {
        vec4 result = vec4(0.0);
        result += texture2D(texture, blurTextureCoordinates[0]) * 0.0044299121055113265;
        result += texture2D(texture, blurTextureCoordinates[1]) * 0.00895781211794;
        result += texture2D(texture, blurTextureCoordinates[2]) * 0.0215963866053;
        result += texture2D(texture, blurTextureCoordinates[3]) * 0.0443683338718;
        result += texture2D(texture, blurTextureCoordinates[4]) * 0.0776744219933;
        result += texture2D(texture, blurTextureCoordinates[5]) * 0.115876621105;
        result += texture2D(texture, blurTextureCoordinates[6]) * 0.147308056121;
        result += texture2D(texture, blurTextureCoordinates[7]) * 0.159576912161;
        result += texture2D(texture, blurTextureCoordinates[8]) * 0.147308056121;
        result += texture2D(texture, blurTextureCoordinates[9]) * 0.115876621105;
        result += texture2D(texture, blurTextureCoordinates[10]) * 0.0776744219933;
        result += texture2D(texture, blurTextureCoordinates[11]) * 0.0443683338718;
        result += texture2D(texture, blurTextureCoordinates[12]) * 0.0215963866053;
        result += texture2D(texture, blurTextureCoordinates[13]) * 0.00895781211794;
        result += texture2D(texture, blurTextureCoordinates[14]) * 0.0044299121055113265;
        return result;
      }
    `
  }

  constructor(options = {}) {
    super(options);
    let textureName = options.textureName || "blurTexture";
    this.add({
      uniforms: {
        blurDistance: options.distance,
        [textureName]: options.texture
      },
      vertexShaderChunks: [
        ["start", `
          uniform vec2 blurDistance;
          ${BlurShader.computeBlurTextureCoordinates()}
        `],
        ["end", `computeBlurTextureCoordinates(uv, blurDistance);`]
      ],
      fragmentShaderChunks: [
        ["start", `
          uniform sampler2D ${textureName};

          ${BlurShader.blur()}
        `],
        ["end", `gl_FragColor = blur(${textureName});`]
      ]
    });
  }
}
