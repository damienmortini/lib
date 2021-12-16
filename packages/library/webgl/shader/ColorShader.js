// https://www.shadertoy.com/view/lsS3Wc

export const rgbToHSL = () => {
  return `
    vec3 rgbToHSL(vec3 col) {
      float minc = min( col.r, min(col.g, col.b) );
      float maxc = max( col.r, max(col.g, col.b) );
      vec3  mask = step(col.grr,col.rgb) * step(col.bbg,col.rgb);
      vec3 h = mask * (vec3(0.0,2.0,4.0) + (col.gbr-col.brg)/(maxc-minc + 0.000001)) / 6.0;
      return vec3( fract( 1.0 + h.x + h.y + h.z ),              // H
                  (maxc-minc)/(1.0-abs(minc+maxc-1.0) + 0.000001),  // S
                  (minc+maxc)*0.5 );                           // L
    }
  `
}

export const hslToRGB = () => {
  return `
    vec3 hslToRGB(vec3 c) {
      vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
      return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
    }
  `
}

export const rgbToHSV = () => {
  return `
    vec3 rgbToHSV(vec3 c)
    {
      vec4 k = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
      vec4 p = mix(vec4(c.zy, k.wz), vec4(c.yz, k.xy), (c.z<c.y) ? 1.0 : 0.0);
      vec4 q = mix(vec4(p.xyw, c.x), vec4(c.x, p.yzx), (p.x<c.x) ? 1.0 : 0.0);
      float d = q.x - min(q.w, q.y);
      return vec3(abs(q.z + (q.w - q.y) / (6.0*d+0.000001)), d / (q.x+0.000001), q.x);
    }
  `
}

export const hsvToRGB = () => {
  return `
    vec3 hsvToRGB(vec3 c)
    {
      vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
      return c.z * mix( vec3(1.0), rgb, c.y);
    }
  `
}


// TODO: OKLAB Conversion

// struct Lab {float L; float a; float b;};
// struct RGB {float r; float g; float b;};

// Lab linear_srgb_to_oklab(RGB c) 
// {
//     float l = 0.4122214708f * c.r + 0.5363325363f * c.g + 0.0514459929f * c.b;
// 	float m = 0.2119034982f * c.r + 0.6806995451f * c.g + 0.1073969566f * c.b;
// 	float s = 0.0883024619f * c.r + 0.2817188376f * c.g + 0.6299787005f * c.b;

//     float l_ = cbrtf(l);
//     float m_ = cbrtf(m);
//     float s_ = cbrtf(s);

//     return {
//         0.2104542553f*l_ + 0.7936177850f*m_ - 0.0040720468f*s_,
//         1.9779984951f*l_ - 2.4285922050f*m_ + 0.4505937099f*s_,
//         0.0259040371f*l_ + 0.7827717662f*m_ - 0.8086757660f*s_,
//     };
// }

// RGB oklab_to_linear_srgb(Lab c) 
// {
//     float l_ = c.L + 0.3963377774f * c.a + 0.2158037573f * c.b;
//     float m_ = c.L - 0.1055613458f * c.a - 0.0638541728f * c.b;
//     float s_ = c.L - 0.0894841775f * c.a - 1.2914855480f * c.b;

//     float l = l_*l_*l_;
//     float m = m_*m_*m_;
//     float s = s_*s_*s_;

//     return {
// 		+4.0767416621f * l - 3.3077115913f * m + 0.2309699292f * s,
// 		-1.2684380046f * l + 2.6097574011f * m - 0.3413193965f * s,
// 		-0.0041960863f * l - 0.7034186147f * m + 1.7076147010f * s,
//     };
// }