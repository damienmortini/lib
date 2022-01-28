// The MIT License
// Copyright © 2013 Inigo Quilez
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// Value    Noise 2D, Derivatives: https://www.shadertoy.com/view/4dXBRH
// Gradient Noise 2D, Derivatives: https://www.shadertoy.com/view/XdXBRH
// Value    Noise 3D, Derivatives: https://www.shadertoy.com/view/XsXfRH
// Gradient Noise 3D, Derivatives: https://www.shadertoy.com/view/4dffRH
// Value    Noise 2D             : https://www.shadertoy.com/view/lsf3WH
// Value    Noise 3D             : https://www.shadertoy.com/view/4sfGzS
// Gradient Noise 2D             : https://www.shadertoy.com/view/XdXGW8
// Gradient Noise 3D             : https://www.shadertoy.com/view/Xsl3Dl
// Simplex  Noise 2D             : https://www.shadertoy.com/view/Msf3WH
// Wave     Noise 2D             : https://www.shadertoy.com/view/tldSRj

export const gradientNoise2D = ({ hashFunctionName = 'hash2' } = {}) => {
  return `float gradientNoise2D(in vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(mix(dot(${hashFunctionName}(i + vec2(0.0, 0.0)) * 2. - 1., f - vec2(0.0, 0.0)), dot(${hashFunctionName}(i + vec2(1.0, 0.0)) * 2. - 1., f - vec2(1.0, 0.0)), u.x), mix(dot(${hashFunctionName}(i + vec2(0.0, 1.0)) * 2. - 1., f - vec2(0.0, 1.0)), dot(${hashFunctionName}(i + vec2(1.0, 1.0)) * 2. - 1., f - vec2(1.0, 1.0)), u.x), u.y);
}
`
}

export const gradientNoise2DDerivatives = ({ hashFunctionName = 'hash2' } = {}) => {
  return `vec3 gradientNoise2DDerivatives(in vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);

  vec2 ga = ${hashFunctionName}(i + vec2(0.0, 0.0)) * 2. - 1.;
  vec2 gb = ${hashFunctionName}(i + vec2(1.0, 0.0)) * 2. - 1.;
  vec2 gc = ${hashFunctionName}(i + vec2(0.0, 1.0)) * 2. - 1.;
  vec2 gd = ${hashFunctionName}(i + vec2(1.0, 1.0)) * 2. - 1.;

  float va = dot(ga, f - vec2(0.0, 0.0));
  float vb = dot(gb, f - vec2(1.0, 0.0));
  float vc = dot(gc, f - vec2(0.0, 1.0));
  float vd = dot(gd, f - vec2(1.0, 1.0));

  return vec3(va + u.x * (vb - va) + u.y * (vc - va) + u.x * u.y * (va - vb - vc + vd),   // value
  ga + u.x * (gb - ga) + u.y * (gc - ga) + u.x * u.y * (ga - gb - gc + gd) +  // derivatives
    du * (u.yx * (va - vb - vc + vd) + vec2(vb, vc) - va));
}
`
}

export const valueNoise3D = ({ hashFunctionName = 'hash1' } = {}) => {
  return `float valueNoise3D( in vec3 x ) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f*f*(3.0-2.0*f);

  return mix(mix(mix( ${hashFunctionName}(i+vec3(0,0,0)), 
  ${hashFunctionName}(i+vec3(1,0,0)),f.x),
  mix( ${hashFunctionName}(i+vec3(0,1,0)), 
  ${hashFunctionName}(i+vec3(1,1,0)),f.x),f.y),
  mix(mix( ${hashFunctionName}(i+vec3(0,0,1)), 
  ${hashFunctionName}(i+vec3(1,0,1)),f.x),
  mix( ${hashFunctionName}(i+vec3(0,1,1)), 
  ${hashFunctionName}(i+vec3(1,1,1)),f.x),f.y),f.z);
}
`
}

export const valueNoise3DDerivatives = ({ hashFunctionName = 'hash1' } = {}) => {
  return `vec4 valueNoise3DDerivatives( in vec3 x ){
  vec3 i = floor(x);
  vec3 w = fract(x);

  #if 0
  // quintic interpolation
  vec3 u = w*w*w*(w*(w*6.0-15.0)+10.0);
  vec3 du = 30.0*w*w*(w*(w-2.0)+1.0);
  #else
  // cubic interpolation
  vec3 u = w*w*(3.0-2.0*w);
  vec3 du = 6.0*w*(1.0-w);
  #endif

  float a = ${hashFunctionName}(i+vec3(0.0,0.0,0.0));
  float b = ${hashFunctionName}(i+vec3(1.0,0.0,0.0));
  float c = ${hashFunctionName}(i+vec3(0.0,1.0,0.0));
  float d = ${hashFunctionName}(i+vec3(1.0,1.0,0.0));
  float e = ${hashFunctionName}(i+vec3(0.0,0.0,1.0));
  float f = ${hashFunctionName}(i+vec3(1.0,0.0,1.0));
  float g = ${hashFunctionName}(i+vec3(0.0,1.0,1.0));
  float h = ${hashFunctionName}(i+vec3(1.0,1.0,1.0));

  float k0 =   a;
  float k1 =   b - a;
  float k2 =   c - a;
  float k3 =   e - a;
  float k4 =   a - b - c + d;
  float k5 =   a - c - e + g;
  float k6 =   a - b - e + f;
  float k7 = - a + b + c - d + e - f - g + h;

  return vec4( k0 + k1*u.x + k2*u.y + k3*u.z + k4*u.x*u.y + k5*u.y*u.z + k6*u.z*u.x + k7*u.x*u.y*u.z, 
  du * vec3( k1 + k4*u.y + k6*u.z + k7*u.y*u.z,
  k2 + k5*u.z + k4*u.x + k7*u.z*u.x,
  k3 + k6*u.x + k5*u.y + k7*u.x*u.y ) );
}
`
}

export const gradientNoise3D = ({ hashFunctionName = 'hash3' } = {}) => {
  return `float gradientNoise3D(in vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);

  vec3 u = f * f * (3.0 - 2.0 * f);

  return mix(mix(mix(dot(${hashFunctionName}(i + vec3(0.0, 0.0, 0.0)) * 2. - 1., f - vec3(0.0, 0.0, 0.0)), dot(${hashFunctionName}(i + vec3(1.0, 0.0, 0.0)) * 2. - 1., f - vec3(1.0, 0.0, 0.0)), u.x), mix(dot(${hashFunctionName}(i + vec3(0.0, 1.0, 0.0)) * 2. - 1., f - vec3(0.0, 1.0, 0.0)), dot(${hashFunctionName}(i + vec3(1.0, 1.0, 0.0)) * 2. - 1., f - vec3(1.0, 1.0, 0.0)), u.x), u.y), mix(mix(dot(${hashFunctionName}(i + vec3(0.0, 0.0, 1.0)) * 2. - 1., f - vec3(0.0, 0.0, 1.0)), dot(${hashFunctionName}(i + vec3(1.0, 0.0, 1.0)) * 2. - 1., f - vec3(1.0, 0.0, 1.0)), u.x), mix(dot(${hashFunctionName}(i + vec3(0.0, 1.0, 1.0)) * 2. - 1., f - vec3(0.0, 1.0, 1.0)), dot(${hashFunctionName}(i + vec3(1.0, 1.0, 1.0)) * 2. - 1., f - vec3(1.0, 1.0, 1.0)), u.x), u.y), u.z);
}
`
}

export const gradientNoise3DDerivatives = ({ hashFunctionName = 'hash3' } = {}) => {
  return `vec4 gradientNoise3DDerivatives(in vec3 x) {
  vec3 p = floor(x);
  vec3 w = fract(x);

  vec3 u = w * w * w * (w * (w * 6.0 - 15.0) + 10.0);
  vec3 du = 30.0 * w * w * (w * (w - 2.0) + 1.0);

  vec3 ga = ${hashFunctionName}(p + vec3(0.0, 0.0, 0.0)) * 2. - 1.;
  vec3 gb = ${hashFunctionName}(p + vec3(1.0, 0.0, 0.0)) * 2. - 1.;
  vec3 gc = ${hashFunctionName}(p + vec3(0.0, 1.0, 0.0)) * 2. - 1.;
  vec3 gd = ${hashFunctionName}(p + vec3(1.0, 1.0, 0.0)) * 2. - 1.;
  vec3 ge = ${hashFunctionName}(p + vec3(0.0, 0.0, 1.0)) * 2. - 1.;
  vec3 gf = ${hashFunctionName}(p + vec3(1.0, 0.0, 1.0)) * 2. - 1.;
  vec3 gg = ${hashFunctionName}(p + vec3(0.0, 1.0, 1.0)) * 2. - 1.;
  vec3 gh = ${hashFunctionName}(p + vec3(1.0, 1.0, 1.0)) * 2. - 1.;

  float va = dot(ga, w - vec3(0.0, 0.0, 0.0));
  float vb = dot(gb, w - vec3(1.0, 0.0, 0.0));
  float vc = dot(gc, w - vec3(0.0, 1.0, 0.0));
  float vd = dot(gd, w - vec3(1.0, 1.0, 0.0));
  float ve = dot(ge, w - vec3(0.0, 0.0, 1.0));
  float vf = dot(gf, w - vec3(1.0, 0.0, 1.0));
  float vg = dot(gg, w - vec3(0.0, 1.0, 1.0));
  float vh = dot(gh, w - vec3(1.0, 1.0, 1.0));

  return vec4((va + u.x * (vb - va) + u.y * (vc - va) + u.z * (ve - va) + u.x * u.y * (va - vb - vc + vd) + u.y * u.z * (va - vc - ve + vg) + u.z * u.x * (va - vb - ve + vf) + (-va + vb + vc - vd + ve - vf - vg + vh) * u.x * u.y * u.z), ga + u.x * (gb - ga) + u.y * (gc - ga) + u.z * (ge - ga) + u.x * u.y * (ga - gb - gc + gd) + u.y * u.z * (ga - gc - ge + gg) + u.z * u.x * (ga - gb - ge + gf) + (-ga + gb + gc - gd + ge - gf - gg + gh) * u.x * u.y * u.z + du * (vec3(vb, vc, ve) - va + u.yzx * vec3(va - vb - vc + vd, va - vc - ve + vg, va - vb - ve + vf) + u.zxy * vec3(va - vb - ve + vf, va - vb - vc + vd, va - vc - ve + vg) + u.yzx * u.zxy * (-va + vb + vc - vd + ve - vf - vg + vh)));
}
`
}

export const simplexNoise2D = ({ hashFunctionName = 'hash2' } = {}) => {
  return `float simplexNoise2D(in vec2 p) {
    const float K1 = 0.366025404; // (sqrt(3)-1)/2;
    const float K2 = 0.211324865; // (3-sqrt(3))/6;

    vec2 i = floor(p + (p.x + p.y) * K1);
    vec2 a = p - i + (i.x + i.y) * K2;
    float m = step(a.y, a.x);
    vec2 o = vec2(m, 1.0 - m);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0 * K2;
    vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
    vec3 n = h * h * h * h * vec3(dot(a, ${hashFunctionName}(i + 0.0) * 2. - 1.), dot(b, ${hashFunctionName}(i + o) * 2. - 1.), dot(c, ${hashFunctionName}(i + 1.0) * 2. - 1.));
    return dot(n, vec3(70.0));
}
`
}
