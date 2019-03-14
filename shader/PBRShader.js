// GGX from from http://www.filmicworlds.com/images/ggx-opt/optimized-ggx.hlsl
// PBR adapted from from https://www.shadertoy.com/view/XsfXWX

import LightShader from "./LightShader.js";
import RayShader from "./RayShader.js";
import CameraShader from "./CameraShader.js";

export default class PBRShader {
  static get PhysicallyBasedMaterial() {
    return `
    struct PhysicallyBasedMaterial
    {
      vec3 albedo;
      float metalness;
      float roughness;
      float reflectance;
    };
    `;
  }

  static ggx() {
    return `
    #define PI 3.1415926535897932384626433832795

    float G1V(float dotNV, float k)
    {
      return 1. / (dotNV * (1. - k) + k);
    }

    float ggx(vec3 N, vec3 V, vec3 L, float roughness, float F0)
    {
      roughness = .01 + roughness * .99;

      float alpha = roughness * roughness;

      vec3 H = normalize(V + L);

      float dotNL = clamp(dot(N, L), 0., 1.);
      float dotNV = clamp(dot(N, V), 0., 1.);
      float dotNH = clamp(dot(N, H), 0., 1.);
      float dotLH = clamp(dot(L, H), 0., 1.);

      float F, D, vis;

      // D
      float alphaSqr = alpha * alpha;
      float denom = dotNH * dotNH * (alphaSqr - 1.) + 1.;
      D = alphaSqr / (PI * denom * denom);

      // F
      float dotLH5 = pow(1. - dotLH, 5.);
      F = F0 + (1. - F0) * dotLH5;

      // V
      float k = alpha / 2.;
      vis = G1V(dotNL, k) * G1V(dotNV, k);

      float specular = dotNL * D * F * vis;
      return specular;
    }
    `;
  }

  static computeGGXLighting() {
    return `
    vec3 computeGGXLighting (
      Ray ray,
      Light light,
      vec3 normal,
      PhysicallyBasedMaterial material
    ) {
      vec3 specular = light.color * ggx(normal, -ray.direction, -light.direction, material.roughness, material.reflectance);
      return specular;
    }
    `;
  }

  static computePBRColor({
    pbrReflectionFromRay = `
      vec3 color = ray.direction * .5 + .5;
      float grey = color.r;
      grey = smoothstep((1. - roughness) * .5, .5 + roughness * .5, grey);
      color = vec3(grey);
      return color;
    `,
  } = {}) {
    return `
    vec3 pbrReflectionFromRay(
      Ray ray,
      float roughness
    ) {
      ${pbrReflectionFromRay}
    }

    vec3 computePBRColor (
      Ray ray,
      Light light,
      vec3 position,
      vec3 normal,
      PhysicallyBasedMaterial material
    ) {
      light.color *= light.intensity;

      // fresnel
      float fresnel = max(1. - dot(mix(normal, -ray.direction, material.roughness), -ray.direction), material.metalness);

      // reflection
      vec3 reflection = pbrReflectionFromRay(Ray(position, normalize(reflect(ray.direction, normal))), material.roughness);

      // diffuse
      vec3 color = mix(material.albedo, reflection, material.metalness);
      color = mix(color, reflection, fresnel);
      color *= light.color;

      color += computeGGXLighting(ray, light, normal, material);
      color = clamp(vec3(0.), vec3(1.), color);

      return color;
    }
    `;
  }

  constructor({
    albedo = [1, 1, 1],
    metalness = 0,
    roughness = 0,
    reflectance = 1,
    uvs = true,
  } = {}) {
    this._uvs = !!uvs;

    this.uniforms = {
      material: {
        albedo,
        metalness,
        roughness,
        reflectance,
      },
    };
  }

  get vertexShaderChunks() {
    return [
      ["start", `
        ${CameraShader.Camera}
        ${RayShader.Ray}
        
        uniform Camera camera;
        uniform mat4 projectionView;
        uniform mat4 transform;

        in vec3 position;
        in vec3 normal;
        ${this._uvs ? "in vec2 uv;" : ""}
        
        out vec3 vPosition;
        out vec3 vNormal;
        ${this._uvs ? "out vec2 vUv;" : ""}
        out vec3 vRayDirection;

        ${RayShader.rayFromCamera()}
      `],
      ["main", `
        vPosition = position;
        vNormal = normal;
        ${this._uvs ? "vUv = uv;" : ""}
      `],
      ["end", `
        gl_Position = camera.projectionView * transform * vec4(position, 1.);
        vRayDirection = rayFromCamera(gl_Position.xy, camera).direction;
      `],
    ];
  }

  get fragmentShaderChunks() {
    return [
      ["start", `
        ${LightShader.Light}
        ${RayShader.Ray}
        ${PBRShader.PhysicallyBasedMaterial}

        uniform PhysicallyBasedMaterial material;
        uniform Light light;

        in vec3 vPosition;
        in vec3 vNormal;
        ${this._uvs ? "in vec2 vUv;" : ""}
        in vec3 vRayDirection;

        ${PBRShader.ggx()}
        ${PBRShader.computeGGXLighting()}
        ${PBRShader.computePBRColor()}
      `],
      ["end", `
        Light light = Light(vec3(1.), vec3(1.), normalize(vec3(-1.)), 1.);
        Ray pbrRay = Ray(vec3(0.), vRayDirection);
        vec3 pbrColor = computePBRColor(pbrRay, light, vPosition, vNormal, material);
        fragColor = vec4(pbrColor, 1.);
      `],
    ];
  }
}
