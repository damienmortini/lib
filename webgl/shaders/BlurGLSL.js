// From https://github.com/Jam3/glsl-fast-gaussian-blur

export default class BlurGLSL {
  static vertex() {
    return `
      varying vec2 blurTextureCoordinates[15];

      void computeBlurTextureCoordinates(vec2 uv, vec2 direction) {
        blurTextureCoordinates[0] = uv + vec2(-.028) * direction;
        blurTextureCoordinates[1] = uv + vec2(-.024) * direction;
        blurTextureCoordinates[2] = uv + vec2(-.020) * direction;
        blurTextureCoordinates[3] = uv + vec2(-.016) * direction;
        blurTextureCoordinates[4] = uv + vec2(-.012) * direction;
        blurTextureCoordinates[5] = uv + vec2(-.008) * direction;
        blurTextureCoordinates[6] = uv + vec2(-.004) * direction;
        blurTextureCoordinates[7] = uv;
        blurTextureCoordinates[8] = uv + vec2(.004) * direction;
        blurTextureCoordinates[9] = uv + vec2(.008) * direction;
        blurTextureCoordinates[10] = uv + vec2(.012) * direction;
        blurTextureCoordinates[11] = uv + vec2(.016) * direction;
        blurTextureCoordinates[12] = uv + vec2(.020) * direction;
        blurTextureCoordinates[13] = uv + vec2(.024) * direction;
        blurTextureCoordinates[14] = uv + vec2(.028) * direction;
      }
    `
  }

  static fragment() {
    return `
      varying vec2 blurTextureCoordinates[15];

      vec4 blur(sampler2D texture, vec2 uv) {
        vec4 result = vec4(0.0);
        result += texture2D(texture, blurTextureCoordinates[0])*0.0044299121055113265;
        result += texture2D(texture, blurTextureCoordinates[1])*0.00895781211794;
        result += texture2D(texture, blurTextureCoordinates[2])*0.0215963866053;
        result += texture2D(texture, blurTextureCoordinates[3])*0.0443683338718;
        result += texture2D(texture, blurTextureCoordinates[4])*0.0776744219933;
        result += texture2D(texture, blurTextureCoordinates[5])*0.115876621105;
        result += texture2D(texture, blurTextureCoordinates[6])*0.147308056121;
        result += texture2D(texture, blurTextureCoordinates[7])*0.159576912161;
        result += texture2D(texture, blurTextureCoordinates[8])*0.147308056121;
        result += texture2D(texture, blurTextureCoordinates[9])*0.115876621105;
        result += texture2D(texture, blurTextureCoordinates[10])*0.0776744219933;
        result += texture2D(texture, blurTextureCoordinates[11])*0.0443683338718;
        result += texture2D(texture, blurTextureCoordinates[12])*0.0215963866053;
        result += texture2D(texture, blurTextureCoordinates[13])*0.00895781211794;
        result += texture2D(texture, blurTextureCoordinates[14])*0.0044299121055113265;
        return result;
      }
    `
  }
}
