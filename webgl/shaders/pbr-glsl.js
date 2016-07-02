// GGX from from http://www.filmicworlds.com/images/ggx-opt/optimized-ggx.hlsl
// PBR from from https://www.shadertoy.com/view/XsfXWX

export default class PBR {
  static PhysicallyBasedMaterial() {
    return `
    struct PhysicallyBasedMaterial
    {
      vec3 albedo;
      float metalness;
      float roughness;
      float reflectance;
    };
    `
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
    `
  }

  static computeGGXLighting() {
    return `
    vec3 computeGGXLighting (
      Ray ray,
      Light light,
      vec3 normal,
      PhysicallyBasedMaterial material
    ) {
      vec3 color = material.albedo;

      vec3 specular = light.color * ggx(normal, -ray.direction, -light.direction, material.roughness, material.reflectance);
      color += specular;

      return color;
    }
    `
  }

  static computePBRLighting(reflectionFromRay = `
    vec3 reflectionFromRay(
      Ray ray,
      Light light
    ) {
      return vec3(1.);
    }`) {
    return `

    ${reflectionFromRay}

    vec3 computePBRLighting (
      Ray ray,
      Light light,
      vec3 position,
      vec3 normal,
      PhysicallyBasedMaterial material
    ) {
      // fresnel
      float fresnel = max(1. - dot(mix(normal, -ray.direction, material.roughness), -ray.direction), material.metalness);

      // reflection
      vec3 roughnessRandomVector = normalize(vec3(rand(position.x) * 2. - 1., rand(position.y) * 2. - 1., rand(position.z) * 2. - 1.)) * material.roughness;
      vec3 reflection = reflectionFromRay(Ray(position, normalize(reflect(ray.direction, normal) + roughnessRandomVector * .3)), light);

      // diffuse
      vec3 color = mix(material.albedo, reflection, material.metalness);
      color = mix(color, reflection, fresnel);

      // specular
      vec3 specular = light.color * ggx(normal, -ray.direction, -light.direction, material.roughness, material.reflectance);
      color += specular;

      return color;
    }
    `
  }
}
