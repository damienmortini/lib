import THREEShaderMaterial from './THREEShaderMaterial.js';
import RayShader from '../../core/shader/RayShader.js';
import LightShader from '../../core/shader/LightShader.js';
import PBRShader from '../../core/shader/PBRShader.js';
import { Color, Vector3, ShaderChunk } from '../../../three/src/Three.js';

export default class THREEPBRMaterial extends THREEShaderMaterial {
  constructor(options = {}) {
    const webgl2 = options.webgl2 === undefined ? true : options.webgl2;
    const vertexChunks = options.vertexChunks || [];
    const fragmentChunks = options.fragmentChunks || [];
    const uniforms = options.uniforms || {};
    const pbrDiffuseLightFromRay = options.pbrDiffuseLightFromRay || (uniforms.envMap ? `
      vec4 texel = ${webgl2 ? 'textureLod' : 'textureCubeLodEXT'}(envMap, ray.direction, roughness * ${Math.log2(uniforms.envMap.image.width).toFixed(1)});
      return texel.rgb;
    ` : undefined);
    const pbrReflectionFromRay = options.pbrReflectionFromRay || (uniforms.envMap ? `
      vec4 texel = ${webgl2 ? 'textureLod' : 'textureCubeLodEXT'}(envMap, ray.direction, roughness * ${Math.log2(uniforms.envMap.image.width).toFixed(1)});
      return texel.rgb;
    ` : undefined);

    options = Object.assign({}, options);

    delete options.vertexChunks;
    delete options.fragmentChunks;
    delete options.uniforms;
    delete options.pbrDiffuseLightFromRay;
    delete options.pbrReflectionFromRay;
    delete options.webgl2;

    const inversePolyfill = `
      mat4 inverse(mat4 m) {
        float
            a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3],
            a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3],
            a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3],
            a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3],
      
            b00 = a00 * a11 - a01 * a10,
            b01 = a00 * a12 - a02 * a10,
            b02 = a00 * a13 - a03 * a10,
            b03 = a01 * a12 - a02 * a11,
            b04 = a01 * a13 - a03 * a11,
            b05 = a02 * a13 - a03 * a12,
            b06 = a20 * a31 - a21 * a30,
            b07 = a20 * a32 - a22 * a30,
            b08 = a20 * a33 - a23 * a30,
            b09 = a21 * a32 - a22 * a31,
            b10 = a21 * a33 - a23 * a31,
            b11 = a22 * a33 - a23 * a32,
      
            det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
      
        return mat4(
            a11 * b11 - a12 * b10 + a13 * b09,
            a02 * b10 - a01 * b11 - a03 * b09,
            a31 * b05 - a32 * b04 + a33 * b03,
            a22 * b04 - a21 * b05 - a23 * b03,
            a12 * b08 - a10 * b11 - a13 * b07,
            a00 * b11 - a02 * b08 + a03 * b07,
            a32 * b02 - a30 * b05 - a33 * b01,
            a20 * b05 - a22 * b02 + a23 * b01,
            a10 * b10 - a11 * b08 + a13 * b06,
            a01 * b08 - a00 * b10 - a03 * b06,
            a30 * b04 - a31 * b02 + a33 * b00,
            a21 * b02 - a20 * b04 - a23 * b00,
            a11 * b07 - a10 * b09 - a12 * b06,
            a00 * b09 - a01 * b07 + a02 * b06,
            a31 * b01 - a30 * b03 - a32 * b00,
            a20 * b03 - a21 * b01 + a22 * b00) / det;
      }
    `;

    super(Object.assign({
      lights: !!uniforms.light,
      uniforms: Object.assign({
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
      }, uniforms),
      vertex: `
        void main() {
        }
      `,
      vertexChunks: [
        ['start', `
          ${RayShader.Ray}

          ${options.skinning ? ShaderChunk.skinning_pars_vertex : ''}
          
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec2 vUv;
          varying vec3 vRayDirection;
          varying vec3 vViewPosition;

          ${webgl2 ? '' : inversePolyfill}
        `],
        ['main', `
          vec3 pbrPosition = position;
          vec3 pbrNormal = normal;
          
          ${options.skinning ? ShaderChunk.skinbase_vertex : ''}
          ${options.skinning ? ShaderChunk.skinnormal_vertex.replace(/objectNormal/g, 'pbrNormal') : ''}
          ${options.skinning ? ShaderChunk.skinning_vertex.replace(/transformed/g, 'pbrPosition') : ''}
        `],
        ['end', `
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pbrPosition, 1.);
          Ray ray = Ray(cameraPosition, mat3(inverse(viewMatrix)) * (inverse(projectionMatrix) * vec4((gl_Position.xy / gl_Position.w), 1., 1.)).xyz);
          
          vRayDirection = ray.direction;
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
          ${PBRShader.PhysicallyBasedMaterial}
          
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
          varying vec3 vRayDirection;

          ${PBRShader.computePBRColor({ pbrReflectionFromRay, pbrDiffuseLightFromRay })}
        `],
        ['main', `
          ${uniforms.map ? 'vec4 mapTexel = texture2D(map, vUv);' : ''}
          vec4 pbrColor = computePBRColor(vRayDirection, light, vPosition, vNormal, PhysicallyBasedMaterial(vec4(${uniforms.map ? 'baseColor * mapTexel.rgb' : 'baseColor'}, ${uniforms.map ? 'opacity * mapTexel.a' : 'opacity'}), metalness, roughness));
        `],
        ['end', `
          gl_FragColor = pbrColor;
        `],
        ...fragmentChunks,
      ],
    }, options));
  }
}
