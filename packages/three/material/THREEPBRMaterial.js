import THREEShaderMaterial from "./THREEShaderMaterial.js";
import RayShader from "../../lib/shader/RayShader.js";
import LightShader from "../../lib/shader/LightShader.js";
import PBRShader from "../../lib/shader/PBRShader.js";
import { Color, Vector3, ShaderChunk } from "../../../three/src/Three.js";

export default class THREEPBRMaterial extends THREEShaderMaterial {
  constructor({
    baseColor = new Color("#ffffff"),
    metalness = 0,
    roughness = 0,
    opacity = 1,
    map = undefined,
    envMap = undefined,
    light = {
      intensity: 0,
      color: new Color("#ffffff"),
      position: new Vector3(),
      direction: new Vector3(),
    },
    skinning = false,
    pbrDiffuseLightFromRay = envMap ? `
      vec4 texel = textureLod(envMap, ray.direction, roughness * ${Math.log2(envMap.image.width).toFixed(1)});
      return texel.rgb + texel.a;
    ` : undefined,
    pbrReflectionFromRay = envMap ? `
      vec4 texel = textureLod(envMap, ray.direction, roughness * ${Math.log2(envMap.image.width).toFixed(1)});
      return texel.rgb + texel.a;
    ` : undefined,
    vertexShaderChunks = [],
    fragmentShaderChunks = [],
    uniforms = {},
  } = {}) {
    super({
      lights: !!light,
      skinning,
      uniforms: Object.assign({
        baseColor,
        metalness,
        roughness,
        opacity,
        map,
        envMap,
        light,
      }, uniforms),
      vertexShader: `
        void main() {
        }
      `,
      vertexShaderChunks: [
        ["start", `
          ${RayShader.Ray}

          ${ShaderChunk.skinning_pars_vertex}
          
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec2 vUv;
          varying Ray vRay;
          varying vec3 vViewPosition;
        `],
        ["main", `
          vec3 position = position;
          vec3 normal = normal;
          vec2 uv = uv;

          ${ShaderChunk.skinbase_vertex}
          ${ShaderChunk.skinnormal_vertex.replace(/objectNormal/g, "normal")}
          ${ShaderChunk.skinning_vertex.replace(/transformed/g, "position")}

          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
          Ray ray = Ray(cameraPosition, mat3(inverse(viewMatrix)) * (inverse(projectionMatrix) * vec4((gl_Position.xy / gl_Position.w), 1., 1.)).xyz);
        `],
        ["end", `
          vRay = ray;
          vPosition = position;
          vNormal = mat3(modelMatrix) * normal;
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
          ${envMap ? "uniform samplerCube envMap;" : ""}
          ${map ? "uniform sampler2D map;" : ""}

          varying vec3 vNormal;
          varying vec3 vPosition;
          varying vec2 vUv;
          varying Ray vRay;

          ${PBRShader.computePBRColor({ pbrReflectionFromRay, pbrDiffuseLightFromRay })}
        `],
        ["main", `
          ${map ? `
            vec4 mapTexel = texture2D(map, vUv);
            vec3 baseColor = baseColor * mapTexel.rgb;
            float opacity = opacity * mapTexel.a;
          ` : ""}
        `],
        ["end", `
          gl_FragColor = computePBRColor(vRay.direction, light, vPosition, vNormal, PhysicallyBasedMaterial(vec4(baseColor, opacity), metalness, roughness));
        `],
        ...fragmentShaderChunks,
      ],
    });
  }
}
