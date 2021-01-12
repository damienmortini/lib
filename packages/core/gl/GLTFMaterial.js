import BasicShader from '../shader/BasicShader.js';
import DataTextureShader from '../shader/DataTextureShader.js';
import SkinShader from '../shader/SkinShader.js';
import GLProgram from './GLProgram.js';

const SKIN_SHADER = {
  vertexChunks: [
    ['start', `
      uniform highp sampler2D jointMatricesTexture;
      uniform vec2 jointMatricesTextureSize;

      in uvec4 joint;
      in vec4 weight;

      flat out uvec4 vJoint;
      out vec4 vWeight;

      ${DataTextureShader.getTextureDataChunkFromUV()}
      ${DataTextureShader.getTextureDataChunkFromIndex()}

      ${SkinShader.getJointMatrix()}
    `],
    ['main', `
      mat4 skinMatrix =
        weight.x * getJointMatrix(int(joint.x), 0, jointMatricesTexture, jointMatricesTextureSize) +
        weight.y * getJointMatrix(int(joint.y), 0, jointMatricesTexture, jointMatricesTextureSize) +
        weight.z * getJointMatrix(int(joint.z), 0, jointMatricesTexture, jointMatricesTextureSize) +
        weight.w * getJointMatrix(int(joint.w), 0, jointMatricesTexture, jointMatricesTextureSize);
      position = (skinMatrix * vec4(position, 1.)).xyz;

      mat4 skinNormalMatrix =
        weight.x * getJointMatrix(int(joint.x), 1, jointMatricesTexture, jointMatricesTextureSize) +
        weight.y * getJointMatrix(int(joint.y), 1, jointMatricesTexture, jointMatricesTextureSize) +
        weight.z * getJointMatrix(int(joint.z), 1, jointMatricesTexture, jointMatricesTextureSize) +
        weight.w * getJointMatrix(int(joint.w), 1, jointMatricesTexture, jointMatricesTextureSize);
      normal = (skinNormalMatrix * vec4(normal, 1.)).xyz;

      vJoint = joint;
      vWeight = weight;
    `],
  ],
};

const MORPH_TARGET_SHADER = {
  vertexChunks: [
    ['start', `
    `],
    ['main', `
    `],
  ],
};

export default class GLTFMaterial {
  constructor({
    gl,
    data = null,
    skin = false,
    morphTargets = false,
  }) {
    this.name = data?.name;

    this.program = new GLProgram({
      gl,
      shader: new BasicShader({
        normals: true,
        uvs: true,
        vertexChunks: [
          ...(skin ? SKIN_SHADER.vertexChunks : []),
          ['main', `
            vec3 position = position;
            vec3 normal = normal;
          `],
        ],
        fragmentChunks: [
          ['end', `
            fragColor = vec4(vNormal * .5 + .5, 1.);
          `],
        ],
      }),
    });
  }
}
