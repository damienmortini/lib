// From https://github.com/Jam3/glsl-fast-gaussian-blur

export default class BlurShader {
  constructor({
    uvs = true,
    uniforms = {},
    vertexShaderChunks = [],
    fragmentShaderChunks = [],
  } = {}) {
    return {
      uniforms: Object.assign({
        blurDistance: [1, 1],
        blurTexture: 0,
      }, uniforms),
      vertexShaderChunks: [
        ["start", `
          uniform vec2 blurDistance;

          ${uvs ? "in vec2 uv;" : ""}
          
          ${BlurShader.computeBlurTextureCoordinates()}
        `],
        ["end", "computeBlurTextureCoordinates(uv, blurDistance);"],
        ...vertexShaderChunks,
      ],
      fragmentShaderChunks: [
        ["start", `
          uniform sampler2D blurTexture;
          ${BlurShader.blur()}
        `],
        ["end", "fragColor = blur(blurTexture);"],
        ...fragmentShaderChunks,
      ],
    };
  }

  static computeBlurTextureCoordinates() {
    return `
      out vec2 blurTextureCoordinates[15];

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
    `;
  }

  static blur() {
    return `
      in vec2 blurTextureCoordinates[15];

      vec4 blur(sampler2D inTexture) {
        vec4 result = vec4(0.0);
        result += texture(inTexture, blurTextureCoordinates[0]) * 0.0044299121055113265;
        result += texture(inTexture, blurTextureCoordinates[1]) * 0.00895781211794;
        result += texture(inTexture, blurTextureCoordinates[2]) * 0.0215963866053;
        result += texture(inTexture, blurTextureCoordinates[3]) * 0.0443683338718;
        result += texture(inTexture, blurTextureCoordinates[4]) * 0.0776744219933;
        result += texture(inTexture, blurTextureCoordinates[5]) * 0.115876621105;
        result += texture(inTexture, blurTextureCoordinates[6]) * 0.147308056121;
        result += texture(inTexture, blurTextureCoordinates[7]) * 0.159576912161;
        result += texture(inTexture, blurTextureCoordinates[8]) * 0.147308056121;
        result += texture(inTexture, blurTextureCoordinates[9]) * 0.115876621105;
        result += texture(inTexture, blurTextureCoordinates[10]) * 0.0776744219933;
        result += texture(inTexture, blurTextureCoordinates[11]) * 0.0443683338718;
        result += texture(inTexture, blurTextureCoordinates[12]) * 0.0215963866053;
        result += texture(inTexture, blurTextureCoordinates[13]) * 0.00895781211794;
        result += texture(inTexture, blurTextureCoordinates[14]) * 0.0044299121055113265;
        return result;
      }
    `;
  }
}
