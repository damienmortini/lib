import THREEShaderMaterial from './THREEShaderMaterial.js'
import LightShader from '@damienmortini/core/shader/LightShader.js'
import RayShader from '@damienmortini/core/shader/RayShader.js'
import PBRShader from '@damienmortini/core/shader/PBRShader.js'
import { Color, Vector3, ShaderChunk } from '../../../three/src/Three.js'

export default class THREEPBRMaterial extends THREEShaderMaterial {
  constructor({
    webgl2 = true,
    vertexChunks = [],
    fragmentChunks = [],
    uniforms = {},
    pbrDiffuseLightFromRay = (uniforms.envMap ? `
      vec4 texel = ${webgl2 ? 'textureLod' : 'textureCubeLodEXT'}(envMap, ray.direction, roughness * ${Math.log2(uniforms.envMap.image.width).toFixed(1)});
      return texel.rgb;
    ` : undefined),
    pbrReflectionFromRay = (uniforms.envMap ? `
    vec4 texel = ${webgl2 ? 'textureLod' : 'textureCubeLodEXT'}(envMap, ray.direction, roughness * ${Math.log2(uniforms.envMap.image.width).toFixed(1)});
    return texel.rgb;
  ` : undefined),
    ...options
  } = {}) {
    super({
      lights: !!uniforms.light,
      uniforms: {
        baseColor: new Color('#ffffff'),
        metalness: 0,
        roughness: 0,
        opacity: 1,
        light: {
          intensity: 0,
          color: new Color('#ffffff'),
          position: new Vector3(),
          direction: new Vector3(),
        },
        ...uniforms,
      },
      vertex: `
        void main() {
        }
      `,
      vertexChunks: [
        ['start', `
          ${options.skinning ? '#include <skinning_pars_vertex>' : ''}
          
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec2 vUv;
          varying vec3 vWorldPosition;
          varying vec3 vViewDirection;
        `],
        ['main', `
          vec3 pbrPosition = position;
          vec3 pbrNormal = normal;
          
          ${options.skinning ? ShaderChunk.skinbase_vertex : ''}
          ${options.skinning ? ShaderChunk.skinnormal_vertex.replace(/objectNormal/g, 'pbrNormal') : ''}
          ${options.skinning ? ShaderChunk.skinning_vertex.replace(/transformed/g, 'pbrPosition') : ''}
        `],
        ['end', `
          vec3 pbrWorldPosition = (modelMatrix * vec4(pbrPosition, 1.)).xyz;
          gl_Position = projectionMatrix * viewMatrix * vec4(pbrWorldPosition, 1.);
          
          
          vWorldPosition = pbrWorldPosition;
          vViewDirection = normalize(pbrWorldPosition - cameraPosition);
          vPosition = pbrPosition;
          vNormal = normalize(mat3(modelMatrix) * pbrNormal);
          vUv = uv;
        `],
        ...vertexChunks,
      ],
      fragmentChunks: [
        ['start', `
          ${LightShader.Light}
          ${RayShader.Ray}
          ${PBRShader.MetallicRoughnessMaterial}
          
          uniform vec3 baseColor;
          uniform float metalness;
          uniform float roughness;
          uniform float opacity;
          uniform Light light;
          ${uniforms.envMap ? 'uniform samplerCube envMap;' : ''}
          ${uniforms.map ? 'uniform sampler2D map;' : ''}

          varying vec3 vNormal;
          varying vec3 vPosition;
          varying vec2 vUv;
          varying vec3 vWorldPosition;
          varying vec3 vViewDirection;

          ${PBRShader.computePBRColor({ pbrReflectionFromRay, pbrDiffuseLightFromRay })}
        `],
        ['main', `
          ${uniforms.map ? 'vec4 mapTexel = texture2D(map, vUv);' : ''}
          vec4 pbrColor = computePBRColor(vViewDirection, light, vPosition, vNormal, MetallicRoughnessMaterial(vec4(${uniforms.map ? 'baseColor * pow(mapTexel.rgb, vec3(2.2))' : 'baseColor'}, ${uniforms.map ? 'opacity * mapTexel.a' : 'opacity'}), metalness, roughness));
        `],
        ['end', `
          gl_FragColor = pbrColor;
        `],
        ...fragmentChunks,
      ],
      ...options,
    })
  }
}
