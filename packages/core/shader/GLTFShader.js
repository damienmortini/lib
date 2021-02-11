import Shader from '../3d/Shader.js';
import DataTextureShader from './DataTextureShader.js';
import SkinShader from './SkinShader.js';

export default class GLTFShader extends Shader {
  constructor({
    uniforms = undefined,
    vertexChunks = [],
    fragmentChunks = [],
  } = {}) {
    super({
      uniforms,
      vertexChunks: [
        ['start', `
          uniform mat4 projectionView;
          uniform mat4 transform;
          uniform mat4 normalMatrix;
          uniform vec3 cameraPosition;
          uniform bool skinned;
          
          in vec3 position;
          in vec3 normal;
          in vec2 uv;

          uniform highp sampler2D jointMatricesTexture;
          uniform vec2 jointMatricesTextureSize;

          uniform float morphTargetWeights[4];
          
          in vec3 morphTargetPosition0;
          in vec3 morphTargetPosition1;
          in vec3 morphTargetPosition2;
          in vec3 morphTargetPosition3;
          in vec3 morphTargetNormal0;
          in vec3 morphTargetNormal1;
          in vec3 morphTargetNormal2;
          in vec3 morphTargetNormal3;

          in uvec4 joint;
          in vec4 weight;

          ${DataTextureShader.getTextureDataChunkFromUV()}
          ${DataTextureShader.getTextureDataChunkFromIndex()}

          ${SkinShader.getJointMatrix()}
          ${SkinShader.getSkinMatrix()}
          
          out vec3 vPosition;
          out vec3 vNormal;
          out vec2 vUV;
          out vec3 vViewDirection;
          out vec3 vWorldPosition;
        `],
        ['main', `
          vec3 gltfPosition = position;
          vec3 gltfNormal = normal;

          gltfPosition += morphTargetWeights[0] * morphTargetPosition0;
          gltfPosition += morphTargetWeights[1] * morphTargetPosition1;
          gltfPosition += morphTargetWeights[2] * morphTargetPosition2;
          gltfPosition += morphTargetWeights[3] * morphTargetPosition3;
          gltfNormal += morphTargetWeights[0] * morphTargetNormal0;
          gltfNormal += morphTargetWeights[1] * morphTargetNormal1;
          gltfNormal += morphTargetWeights[2] * morphTargetNormal2;
          gltfNormal += morphTargetWeights[3] * morphTargetNormal3;
          
          if(skinned) {
            mat4 skinMatrix = getSkinMatrix(ivec4(joint), weight, jointMatricesTexture, jointMatricesTextureSize, 0, 8);
            gltfPosition = (skinMatrix * vec4(gltfPosition, 1.)).xyz;

            mat4 skinNormalMatrix = getSkinMatrix(ivec4(joint), weight, jointMatricesTexture, jointMatricesTextureSize, 1, 8);
            gltfNormal = (skinNormalMatrix * vec4(gltfNormal, 1.)).xyz;
          }

          gltfNormal = normalize((normalMatrix * vec4(gltfNormal, 1.)).xyz);

          vec3 worldPosition = (transform * vec4(gltfPosition, 1.)).xyz;
        `],
        ['end', `
          gl_Position = projectionView * vec4(worldPosition, 1.);
          
          vWorldPosition = worldPosition;
          vPosition = gltfPosition;
          vNormal = gltfNormal;
          vUV = uv;
          vViewDirection = normalize(worldPosition - cameraPosition);
        `],
        ...vertexChunks,
      ],
      fragmentChunks: [
        ['start', `
          in vec3 vPosition;
          in vec3 vNormal;
          in vec2 vUV;
          in vec3 vViewDirection;
          in vec3 vWorldPosition;
        `],
        ...fragmentChunks,
      ],
    });
  }
}
