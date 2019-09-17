import THREEShaderMaterial from "./THREEShaderMaterial.js";
import RayShader from "../../lib/shader/RayShader.js";
import LightShader from "../../lib/shader/LightShader.js";
import PBRShader from "../../lib/shader/PBRShader.js";
import { Color, Vector3, ShaderChunk } from "../../../three/src/Three.js";

export default class THREEPBRMaterial extends THREEShaderMaterial {
  constructor(options = {}) {
    const vertexShaderChunks = options.vertexShaderChunks || [];
    const fragmentShaderChunks = options.fragmentShaderChunks || [];
    const uniforms = options.uniforms || {};
    const pbrDiffuseLightFromRay = options.pbrDiffuseLightFromRay || (uniforms.envMap ? `
      vec4 texel = textureLod(envMap, ray.direction, roughness * ${Math.log2(uniforms.envMap.image.width).toFixed(1)});
      return texel.rgb;
    ` : undefined);
    const pbrReflectionFromRay = options.pbrReflectionFromRay || (uniforms.envMap ? `
      vec4 texel = textureLod(envMap, ray.direction, roughness * ${Math.log2(uniforms.envMap.image.width).toFixed(1)});
      return texel.rgb;
    ` : undefined);

    options = Object.assign({}, options);

    delete options.vertexShaderChunks;
    delete options.fragmentShaderChunks;
    delete options.uniforms;
    delete options.pbrDiffuseLightFromRay;
    delete options.pbrReflectionFromRay;

    super(Object.assign({
      lights: !!uniforms.light,
      uniforms: Object.assign({
        baseColor: new Color("#ffffff"),
        metalness: 0,
        roughness: 0,
        opacity: 1,
        light: {
          intensity: 0,
          color: new Color("#ffffff"),
          position: new Vector3(),
          direction: new Vector3(),
        },
      }, uniforms),
      vertexShader: `
        void main() {
        }
      `,
      vertexShaderChunks: [
        ["start", `
          ${RayShader.Ray}

          ${options.skinning ? ShaderChunk.skinning_pars_vertex : ""}
          
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec2 vUv;
          varying Ray vRay;
          varying vec3 vViewPosition;
        `],
        ["main", `
          ${options.skinning ? "vec3 position = position;" : ""}
          ${options.skinning ? "vec3 normal = normal;" : ""}
          ${options.skinning ? ShaderChunk.skinbase_vertex : ""}
          ${options.skinning ? ShaderChunk.skinnormal_vertex.replace(/objectNormal/g, "normal") : ""}
          ${options.skinning ? ShaderChunk.skinning_vertex.replace(/transformed/g, "position") : ""}
        `],
        ["end", `
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
          Ray ray = Ray(cameraPosition, mat3(inverse(viewMatrix)) * (inverse(projectionMatrix) * vec4((gl_Position.xy / gl_Position.w), 1., 1.)).xyz);
          
          vRay = ray;
          vPosition = position;
          vNormal = normalize(mat3(modelMatrix) * normal);
          vUv = uv;
        `],
        ...vertexShaderChunks,
      ],
      fragmentShaderChunks: [
        ["start", `
          ${LightShader.Light}
          ${RayShader.Ray}
          ${PBRShader.PhysicallyBasedMaterial}
          
          uniform vec3 baseColor;
          uniform float metalness;
          uniform float roughness;
          uniform float opacity;
          uniform Light light;
          ${uniforms.envMap ? "uniform samplerCube envMap;" : ""}
          ${uniforms.map ? "uniform sampler2D map;" : ""}

          varying vec3 vNormal;
          varying vec3 vPosition;
          varying vec2 vUv;
          varying Ray vRay;

          ${PBRShader.computePBRColor({ pbrReflectionFromRay, pbrDiffuseLightFromRay })}
        `],
        ["main", `
          ${uniforms.map ? `vec4 mapTexel = texture2D(map, vUv);` : ""}
          vec4 pbrColor = computePBRColor(vRay.direction, light, vPosition, vNormal, PhysicallyBasedMaterial(vec4(${uniforms.map ? "baseColor * mapTexel.rgb" : "baseColor"}, ${uniforms.map ? "opacity * mapTexel.a" : "opacity"}), metalness, roughness));
        `],
        ["end", `
          gl_FragColor = pbrColor;
        `],
        ...fragmentShaderChunks,
      ],
    }, options));
  }
}
