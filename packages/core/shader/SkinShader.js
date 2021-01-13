export default class SkinShader {
  static getJointMatrix() {
    return `
      mat4 getJointMatrix(int index, int matrixIndex, sampler2D matricesTexture, vec2 matricesTextureSize, int matricesTextureStride) {
        vec4 v1 = getTextureDataChunkFromIndex(matricesTexture, index, 0 + matrixIndex * 4, matricesTextureStride, matricesTextureSize);
        vec4 v2 = getTextureDataChunkFromIndex(matricesTexture, index, 1 + matrixIndex * 4, matricesTextureStride, matricesTextureSize);
        vec4 v3 = getTextureDataChunkFromIndex(matricesTexture, index, 2 + matrixIndex * 4, matricesTextureStride, matricesTextureSize);
        vec4 v4 = getTextureDataChunkFromIndex(matricesTexture, index, 3 + matrixIndex * 4, matricesTextureStride, matricesTextureSize);
        mat4 jointMatrix = mat4(v1, v2, v3, v4);
        return jointMatrix;
      }
    `;
  }

  static getSkinMatrix() {
    return `
      mat4 getSkinMatrix(ivec4 jointIndexes, vec4 jointWeights, sampler2D jointMatricesTexture, vec2 jointMatricesTextureSize, int jointMatrixChunkIndex, int jointMatricesTextureStride) {
        return jointWeights.x * getJointMatrix(int(jointIndexes.x), jointMatrixChunkIndex, jointMatricesTexture, jointMatricesTextureSize, jointMatricesTextureStride) +
        jointWeights.y * getJointMatrix(int(jointIndexes.y), jointMatrixChunkIndex, jointMatricesTexture, jointMatricesTextureSize, jointMatricesTextureStride) +
        jointWeights.z * getJointMatrix(int(jointIndexes.z), jointMatrixChunkIndex, jointMatricesTexture, jointMatricesTextureSize, jointMatricesTextureStride) +
        jointWeights.w * getJointMatrix(int(jointIndexes.w), jointMatrixChunkIndex, jointMatricesTexture, jointMatricesTextureSize, jointMatricesTextureStride);
      }
    `;
  }
}
