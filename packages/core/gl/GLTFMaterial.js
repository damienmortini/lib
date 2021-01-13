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

      ${DataTextureShader.getTextureDataChunkFromUV()}
      ${DataTextureShader.getTextureDataChunkFromIndex()}

      ${SkinShader.getJointMatrix()}
      ${SkinShader.getSkinMatrix()}
    `],
    ['main', `
      mat4 skinMatrix = getSkinMatrix(ivec4(joint), weight, jointMatricesTexture, jointMatricesTextureSize, 0, 8);
      position = (skinMatrix * vec4(position, 1.)).xyz;

      mat4 skinNormalMatrix = getSkinMatrix(ivec4(joint), weight, jointMatricesTexture, jointMatricesTextureSize, 1, 8);
      normal = (skinNormalMatrix * vec4(normal, 1.)).xyz;
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
