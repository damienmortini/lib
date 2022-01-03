// https://www.shadertoy.com/view/XlGcRh
// https://www.shadertoy.com/view/XdXBRH

export const hash1 = ({ noUInt = false } = {}) => {
  return `float hash1(float n) {
  return fract(sin(n) * 43758.5453123);
}

float hash1(vec2 n) {
  return fract(sin(dot(n.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float hash1(vec3 n) {
  return hash1(vec2(hash1(n.xy), n.z));
}

float hash1(vec4 n) {
  return hash1(vec2(hash1(n.xyz), n.w));
}
` + (noUInt ? '' : `
float hash1(uint n) {
  // integer hash copied from Hugo Elias
  n = (n << 13U) ^ n;
  n = n * (n * n * 15731U + 789221U) + 1376312589U;
  return float(n & uvec3(0x7fffffffU)) / float(0x7fffffff);
}

float hash1(uvec2 x) {
  uvec2 q = 1103515245U * ((x >> 1U) ^ (x.yx));
  uint n = 1103515245U * ((q.x) ^ (q.y >> 3U));
  return float(n) * (1.0 / float(0xffffffffU));
}
`)
}

export const hash2 = ({ noUInt = false } = {}) => {
  return `vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453123);
}
` + (noUInt ? '' : `
vec2 hash2(uint n) {
  // integer hash copied from Hugo Elias
  n = (n << 13U) ^ n;
  n = n * (n * n * 15731U + 789221U) + 1376312589U;
  uvec3 k = n * uvec3(n, n * 16807U, n * 48271U);
  return (vec3(k & uvec3(0x7fffffffU)) / float(0x7fffffff)).xy;
}

vec2 hash2(uvec2 x) {
  x = ((x >> 8U) ^ x.yx) * 1103515245U;
  x = ((x >> 8U) ^ x.yx) * 1103515245U;
  x = ((x >> 8U) ^ x.yx) * 1103515245U;

  return vec2(x) * (1.0 / float(0xffffffffU));
}
`)
}

export const hash3 = () => {
  return `vec3 hash3(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453123);
}

vec3 hash3(uint n) {
  // integer hash copied from Hugo Elias
  n = (n << 13U) ^ n;
  n = n * (n * n * 15731U + 789221U) + 1376312589U;
  uvec3 k = n * uvec3(n, n * 16807U, n * 48271U);
  return vec3(k & uvec3(0x7fffffffU)) / float(0x7fffffff);
}

vec3 hash3(uvec3 x) {
  x = ((x >> 8U) ^ x.yzx) * 1103515245U;
  x = ((x >> 8U) ^ x.yzx) * 1103515245U;
  x = ((x >> 8U) ^ x.yzx) * 1103515245U;

  return vec3(x) * (1.0 / float(0xffffffffU));
}
`
}
