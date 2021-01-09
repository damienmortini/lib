export default class DataTextureShader {
  static getTextureDataChunkFromUV() {
    return `
      vec4 getTextureDataChunkFromUV(sampler2D dataTexture, vec2 uv, int chunkIndex, int stride, vec2 textureSize) {
        vec2 strideScale = vec2(float(stride), 1.);
        vec2 dataPosition = floor(uv * textureSize / strideScale) * strideScale;
        return texture(dataTexture, vec2(dataPosition.x + float(chunkIndex) + .5, dataPosition.y + .5) / textureSize);
      }
    `;
  }

  static getTextureDataChunkFromIndex() {
    return `
      vec4 getTextureDataChunkFromIndex(sampler2D dataTexture, int index, int chunkIndex, int stride, vec2 textureSize) {
        vec2 uv = vec2(mod(float(index * stride), textureSize.x) / textureSize.x, floor(float(index * stride) / textureSize.x) / textureSize.y);
        return getTextureDataChunkFromUV(dataTexture, uv, chunkIndex, stride, textureSize);
      }
    `;
  }
}
