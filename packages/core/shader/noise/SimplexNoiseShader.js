export const simplexNoise = () => {
  return `
    // The MIT License
    // Copyright © 2013 Inigo Quilez
    // Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
    
    
    // Simplex Noise (http://en.wikipedia.org/wiki/Simplex_noise), a type of gradient noise
    // that uses N+1 vertices for random gradient interpolation instead of 2^N as in regular
    // latice based Gradient Noise.
    
    
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
    
    // https://www.shadertoy.com/view/4djSRW
    vec2 simplexNoiseHash(vec2 p)
      {
        vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
          p3 += dot(p3, p3.yzx+33.33);
          return fract((p3.xx+p3.yz)*p3.zy);
      }
    
    float simplexNoise( in vec2 p )
    {
        const float K1 = 0.366025404; // (sqrt(3)-1)/2;
        const float K2 = 0.211324865; // (3-sqrt(3))/6;
    
      vec2  i = floor( p + (p.x+p.y)*K1 );
        vec2  a = p - i + (i.x+i.y)*K2;
        float m = step(a.y,a.x); 
        vec2  o = vec2(m,1.0-m);
        vec2  b = a - o + K2;
      vec2  c = a - 1.0 + 2.0*K2;
        vec3  h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );
      vec3  n = h*h*h*h*vec3( dot(a,simplexNoiseHash(i+0.0)), dot(b,simplexNoiseHash(i+o)), dot(c,simplexNoiseHash(i+1.0)));
        return dot( n, vec3(70.0) );
    }
  `
}
