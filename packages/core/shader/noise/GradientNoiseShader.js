export const gradientNoise2D = () => {
  return `
      // The MIT License
      // Copyright © 2013 Inigo Quilez
      // Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
      
      
      // Gradient Noise (http://en.wikipedia.org/wiki/Gradient_noise), not to be confused with
      // Value Noise, and neither with Perlin's Noise (which is one form of Gradient Noise)
      // is probably the most convenient way to generate noise (a random smooth signal with 
      // mostly all its energy in the low frequencies) suitable for procedural texturing/shading,
      // modeling and animation.
      //
      // It produces smoother and higher quality than Value Noise, but it's of course slighty more
      // expensive.
      //
      // The princpiple is to create a virtual grid/latice all over the plane, and assign one
      // random vector to every vertex in the grid. When querying/requesting a noise value at
      // an arbitrary point in the plane, the grid cell in which the query is performed is
      // determined (line 32), the four vertices of the grid are determined and their random
      // vectors fetched (lines 37 to 40). Then, the position of the current point under 
      // evaluation relative to each vertex is doted (projected) with that vertex' random
      // vector, and the result is bilinearly interpolated (lines 37 to 40 again) with a 
      // smooth interpolant (line 33 and 35).
      
      
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
      
      
      vec2 gradientNoise2DHash( vec2 x )  // replace this by something better
      {
          const vec2 k = vec2( 0.3183099, 0.3678794 );
          x = x*k + k.yx;
          return -1.0 + 2.0*fract( 16.0 * k*fract( x.x*x.y*(x.x+x.y)) );
      }
      
      float gradientNoise2D( in vec2 p )
      {
          vec2 i = floor( p );
          vec2 f = fract( p );
        
        vec2 u = f*f*(3.0-2.0*f);
      
          return mix( mix( dot( gradientNoise2DHash( i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ), 
                          dot( gradientNoise2DHash( i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                      mix( dot( gradientNoise2DHash( i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ), 
                          dot( gradientNoise2DHash( i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
      }
    `;
};

export const gradientDerivativesNoise2D = () => {
  return `
      // The MIT License
      // Copyright © 2017 Inigo Quilez
      // Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
      
      
      // Computes the analytic derivatives of a 2D Gradient Noise
      
      
      // Value    Noise 2D, Derivatives: https://www.shadertoy.com/view/4dXBRH
      // Gradient Noise 2D, Derivatives: https://www.shadertoy.com/view/XdXBRH
      // Value    Noise 3D, Derivatives: https://www.shadertoy.com/view/XsXfRH
      // Gradient Noise 3D, Derivatives: https://www.shadertoy.com/view/4dffRH
      // Value    Noise 2D             : https://www.shadertoy.com/view/lsf3WH
      // Value    Noise 3D             : https://www.shadertoy.com/view/4sfGzS
      // Gradient Noise 2D             : https://www.shadertoy.com/view/XdXGW8
      // Gradient Noise 3D             : https://www.shadertoy.com/view/Xsl3Dl
      // Simplex  Noise 2D             : https://www.shadertoy.com/view/Msf3WH
      
      
      vec2 gradientDerivativesNoise2DHash( in vec2 x )  // replace this by something better
      {
          const vec2 k = vec2( 0.3183099, 0.3678794 );
          x = x*k + k.yx;
          return -1.0 + 2.0*fract( 16.0 * k*fract( x.x*x.y*(x.x+x.y)) );
      }
      
      
      // return gradient noise (in x) and its derivatives (in yz)
      vec3 gradientDerivativesNoise2D( in vec2 p )
      {
          vec2 i = floor( p );
          vec2 f = fract( p );
      
      #if 1
          // quintic interpolation
          vec2 u = f*f*f*(f*(f*6.0-15.0)+10.0);
          vec2 du = 30.0*f*f*(f*(f-2.0)+1.0);
      #else
          // cubic interpolation
          vec2 u = f*f*(3.0-2.0*f);
          vec2 du = 6.0*f*(1.0-f);
      #endif    
          
          vec2 ga = gradientDerivativesNoise2DHash( i + vec2(0.0,0.0) );
          vec2 gb = gradientDerivativesNoise2DHash( i + vec2(1.0,0.0) );
          vec2 gc = gradientDerivativesNoise2DHash( i + vec2(0.0,1.0) );
          vec2 gd = gradientDerivativesNoise2DHash( i + vec2(1.0,1.0) );
          
          float va = dot( ga, f - vec2(0.0,0.0) );
          float vb = dot( gb, f - vec2(1.0,0.0) );
          float vc = dot( gc, f - vec2(0.0,1.0) );
          float vd = dot( gd, f - vec2(1.0,1.0) );
      
          return vec3( va + u.x*(vb-va) + u.y*(vc-va) + u.x*u.y*(va-vb-vc+vd),   // value
                      ga + u.x*(gb-ga) + u.y*(gc-ga) + u.x*u.y*(ga-gb-gc+gd) +  // derivatives
                      du * (u.yx*(va-vb-vc+vd) + vec2(vb,vc) - va));
      }
    `;
};

export const gradientNoise3D = () => {
  return `
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

      //===============================================================================================
      //===============================================================================================
      //===============================================================================================

      vec3 gradientNoise3DHash( vec3 p ) // replace this by something better
      {
        p = vec3( dot(p,vec3(127.1,311.7, 74.7)),
              dot(p,vec3(269.5,183.3,246.1)),
              dot(p,vec3(113.5,271.9,124.6)));

        return -1.0 + 2.0*fract(sin(p)*43758.5453123);
      }

      float gradientNoise3D( in vec3 p )
      {
          vec3 i = floor( p );
          vec3 f = fract( p );
        
        vec3 u = f*f*(3.0-2.0*f);

          return mix( mix( mix( dot( gradientNoise3DHash( i + vec3(0.0,0.0,0.0) ), f - vec3(0.0,0.0,0.0) ), 
                                dot( gradientNoise3DHash( i + vec3(1.0,0.0,0.0) ), f - vec3(1.0,0.0,0.0) ), u.x),
                          mix( dot( gradientNoise3DHash( i + vec3(0.0,1.0,0.0) ), f - vec3(0.0,1.0,0.0) ), 
                                dot( gradientNoise3DHash( i + vec3(1.0,1.0,0.0) ), f - vec3(1.0,1.0,0.0) ), u.x), u.y),
                      mix( mix( dot( gradientNoise3DHash( i + vec3(0.0,0.0,1.0) ), f - vec3(0.0,0.0,1.0) ), 
                                dot( gradientNoise3DHash( i + vec3(1.0,0.0,1.0) ), f - vec3(1.0,0.0,1.0) ), u.x),
                          mix( dot( gradientNoise3DHash( i + vec3(0.0,1.0,1.0) ), f - vec3(0.0,1.0,1.0) ), 
                                dot( gradientNoise3DHash( i + vec3(1.0,1.0,1.0) ), f - vec3(1.0,1.0,1.0) ), u.x), u.y), u.z );
      }
    `;
};

export const gradientDerivativesNoise3D = ({
  hash = `
      p = vec3( dot(p,vec3(127.1,311.7, 74.7)),
        dot(p,vec3(269.5,183.3,246.1)),
        dot(p,vec3(113.5,271.9,124.6)));

      return -1.0 + 2.0*fract(sin(p)*43758.5453123);
    `,
} = {}) => {
  return `
      // The MIT License
      // Copyright © 2017 Inigo Quilez
      // Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
      
      
      // Computes the analytic derivatives of a 3D Gradient Noise. This can be used for example to compute normals to a
      // 3d rocks based on Gradient Noise without approximating the gradient by having to take central differences. More
      // info here: http://iquilezles.org/www/articles/gradientnoise/gradientnoise.htm
      
      
      // Value    Noise 2D, Derivatives: https://www.shadertoy.com/view/4dXBRH
      // Gradient Noise 2D, Derivatives: https://www.shadertoy.com/view/XdXBRH
      // Value    Noise 3D, Derivatives: https://www.shadertoy.com/view/XsXfRH
      // Gradient Noise 3D, Derivatives: https://www.shadertoy.com/view/4dffRH
      // Value    Noise 2D             : https://www.shadertoy.com/view/lsf3WH
      // Value    Noise 3D             : https://www.shadertoy.com/view/4sfGzS
      // Gradient Noise 2D             : https://www.shadertoy.com/view/XdXGW8
      // Gradient Noise 3D             : https://www.shadertoy.com/view/Xsl3Dl
      // Simplex  Noise 2D             : https://www.shadertoy.com/view/Msf3WH
      
      
      vec3 gradientDerivativesNoise3DHash( vec3 p )
      {
        ${hash}
      }
      
      // return value noise (in x) and its derivatives (in yzw)
      vec4 gradientDerivativesNoise3D( in vec3 x )
      {
          // grid
          vec3 p = floor(x);
          vec3 w = fract(x);
          
          #if 1
          // quintic interpolant
          vec3 u = w*w*w*(w*(w*6.0-15.0)+10.0);
          vec3 du = 30.0*w*w*(w*(w-2.0)+1.0);
          #else
          // cubic interpolant
          vec3 u = w*w*(3.0-2.0*w);
          vec3 du = 6.0*w*(1.0-w);
          #endif    
          
          // gradients
          vec3 ga = gradientDerivativesNoise3DHash( p+vec3(0.0,0.0,0.0) );
          vec3 gb = gradientDerivativesNoise3DHash( p+vec3(1.0,0.0,0.0) );
          vec3 gc = gradientDerivativesNoise3DHash( p+vec3(0.0,1.0,0.0) );
          vec3 gd = gradientDerivativesNoise3DHash( p+vec3(1.0,1.0,0.0) );
          vec3 ge = gradientDerivativesNoise3DHash( p+vec3(0.0,0.0,1.0) );
          vec3 gf = gradientDerivativesNoise3DHash( p+vec3(1.0,0.0,1.0) );
          vec3 gg = gradientDerivativesNoise3DHash( p+vec3(0.0,1.0,1.0) );
          vec3 gh = gradientDerivativesNoise3DHash( p+vec3(1.0,1.0,1.0) );
          
          // projections
          float va = dot( ga, w-vec3(0.0,0.0,0.0) );
          float vb = dot( gb, w-vec3(1.0,0.0,0.0) );
          float vc = dot( gc, w-vec3(0.0,1.0,0.0) );
          float vd = dot( gd, w-vec3(1.0,1.0,0.0) );
          float ve = dot( ge, w-vec3(0.0,0.0,1.0) );
          float vf = dot( gf, w-vec3(1.0,0.0,1.0) );
          float vg = dot( gg, w-vec3(0.0,1.0,1.0) );
          float vh = dot( gh, w-vec3(1.0,1.0,1.0) );
        
          // interpolations
          return vec4( va + u.x*(vb-va) + u.y*(vc-va) + u.z*(ve-va) + u.x*u.y*(va-vb-vc+vd) + u.y*u.z*(va-vc-ve+vg) + u.z*u.x*(va-vb-ve+vf) + (-va+vb+vc-vd+ve-vf-vg+vh)*u.x*u.y*u.z,    // value
                      ga + u.x*(gb-ga) + u.y*(gc-ga) + u.z*(ge-ga) + u.x*u.y*(ga-gb-gc+gd) + u.y*u.z*(ga-gc-ge+gg) + u.z*u.x*(ga-gb-ge+gf) + (-ga+gb+gc-gd+ge-gf-gg+gh)*u.x*u.y*u.z +   // derivatives
                      du * (vec3(vb,vc,ve) - va + u.yzx*vec3(va-vb-vc+vd,va-vc-ve+vg,va-vb-ve+vf) + u.zxy*vec3(va-vb-ve+vf,va-vb-vc+vd,va-vc-ve+vg) + u.yzx*u.zxy*(-va+vb+vc-vd+ve-vf-vg+vh) ));
      }
    `;
};

