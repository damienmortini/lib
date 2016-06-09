// GGX from from http://www.filmicworlds.com/images/ggx-opt/optimized-ggx.hlsl
// PBR from from https://www.shadertoy.com/view/XsfXWX

export default function({
  map = `
  vec3 metalRayPick(vec3 p) {
    return vec3(0.);
  }
  `
} = {}) {
  return `
#define PI 3.1415926535897932384626433832795

struct Light
{
  vec3 color;
  vec3 direction;
};

float G1V(float dotNV, float k)
{
    return 1. / (dotNV * (1. - k) + k);
}

float GGX(vec3 N, vec3 V, vec3 L, float roughness, float F0)
{
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

vec3 computePBRLighting (
  Light light,
  Ray ray,
  vec3 position,
  vec3 normal,
  vec3 albedo,
  float metalness,
  float roughness,
  samplerCube reflectionTexture
) {

  // material
  light.color *= textureCube(reflectionTexture, vec3(1.,0.,0.)).xyz * 1.2;

  // IBL
  vec3 randomRay = vec3(rand(position.x) * 2. - 1., rand(position.y) * 2. - 1., rand(position.z) * 2. - 1.) * .25;
  vec3 iblDiffuse = textureCube(reflectionTexture, normalize(normal + randomRay)).xyz;
  vec3 iblReflection = textureCube(reflectionTexture, normalize(reflect(ray.direction, normal) + randomRay * roughness)).xyz;

  // fresnel
  float fresnel = max(1. - dot(normal, -ray.direction), 0.);
  fresnel = pow(fresnel, 1.5);

  // diffuse
  vec3 diffuse = mix(albedo, iblDiffuse, metalness);
  diffuse = mix(diffuse, iblReflection, fresnel * (1. - roughness));

  vec3 color = mix(diffuse, iblReflection, metalness);

  // specular
  vec3 specular = light.color * GGX(normal, -ray.direction, -light.direction, roughness * .95 + .05, .2);
  color += specular;

  return color;
}
`};
