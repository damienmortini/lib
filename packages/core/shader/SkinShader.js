export default class SkinShader {
  static getJointMatrix() {
    return `
      mat4 getJointMatrix(int index, int matrixID, sampler2D jointMatricesTexture, vec2 jointMatricesTextureSize) {
        vec4 v1 = getTextureDataChunkFromIndex(jointMatricesTexture, index, 0 + matrixID * 4, 8, jointMatricesTextureSize);
        vec4 v2 = getTextureDataChunkFromIndex(jointMatricesTexture, index, 1 + matrixID * 4, 8, jointMatricesTextureSize);
        vec4 v3 = getTextureDataChunkFromIndex(jointMatricesTexture, index, 2 + matrixID * 4, 8, jointMatricesTextureSize);
        vec4 v4 = getTextureDataChunkFromIndex(jointMatricesTexture, index, 3 + matrixID * 4, 8, jointMatricesTextureSize);
        mat4 jointMatrix = mat4(v1, v2, v3, v4);
        return jointMatrix;
      }
    `;
  }
}
