import THREEShaderMaterial from './THREEShaderMaterial.js'
import { ShaderChunk } from '../../../three/src/Three.js'

export default class THREEBaseMaterial extends THREEShaderMaterial {
  constructor({
    vertexChunks = [],
    fragmentChunks = [],
    uniforms = {},
    ...options
  } = {}) {
    super({
      uniforms,
      vertex: `
        void main() {
        }
      `,
      vertexChunks: [
        ['start', `
          ${options.morphTargets ? '#include <morphtarget_pars_vertex>' : ''}
          ${options.skinning ? '#include <skinning_pars_vertex>' : ''}
          
          out vec3 vPosition;
          out vec3 vNormal;
          out vec2 vUV;
          out vec3 vWorldPosition;
          out vec3 vViewDirection;
          out float vFresnel;
        `],
        ['main', `
          vec3 transformedPosition = position;
          vec3 transformedNormal = normal;

          ${options.skinning ? ShaderChunk.skinbase_vertex : ''}

          ${options.morphTargets ? ShaderChunk.morphnormal_vertex.replace(/objectNormal/g, 'transformedNormal') : ''}
          ${options.skinning ? ShaderChunk.skinnormal_vertex.replace(/objectNormal/g, 'transformedNormal') : ''}
          
          ${options.morphTargets ? ShaderChunk.morphtarget_vertex.replace(/transformed/g, 'transformedPosition') : ''}
          ${options.skinning ? ShaderChunk.skinning_vertex.replace(/transformed/g, 'transformedPosition') : ''}
        `],
        ['end', `
          vec3 worldPosition = (modelMatrix * vec4(transformedPosition, 1.)).xyz;
          gl_Position = projectionMatrix * viewMatrix * vec4(worldPosition, 1.);
          
          vWorldPosition = worldPosition;
          vViewDirection = normalize(worldPosition - cameraPosition);
          vPosition = transformedPosition;
          vNormal = normalize(mat3(modelMatrix) * transformedNormal);
          vUV = uv;
          vFresnel = max(0., 1. - dot(-vViewDirection, vNormal));
        `],
        ...vertexChunks,
      ],
      fragmentChunks: [
        ['start', `
          in vec3 vPosition;
          in vec3 vNormal;
          in vec2 vUV;
          in vec3 vWorldPosition;
          in vec3 vViewDirection;
          in float vFresnel;
        `],
        ...fragmentChunks,
      ],
      ...options,
    })
  }
}
