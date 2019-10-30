// https://www.shadertoy.com/view/lsS3Wc

export default class ColorShader {
  static rgbToHSL() {
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
    `;
  }

  static hslToRGB() {
    return `
      vec3 hslToRGB(vec3 c) {
        vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
        return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
      }
    `;
  }

  static rgbToHSV() {
    return `
      vec3 rgbToHSV(vec3 c)
      {
        vec4 k = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
        vec4 p = mix(vec4(c.zy, k.wz), vec4(c.yz, k.xy), (c.z<c.y) ? 1.0 : 0.0);
        vec4 q = mix(vec4(p.xyw, c.x), vec4(c.x, p.yzx), (p.x<c.x) ? 1.0 : 0.0);
        float d = q.x - min(q.w, q.y);
        return vec3(abs(q.z + (q.w - q.y) / (6.0*d+0.000001)), d / (q.x+0.000001), q.x);
      }
    `;
  }

  static hsvToRGB() {
    return `
      vec3 hsvToRGB(vec3 c)
      {
        vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
        return c.z * mix( vec3(1.0), rgb, c.y);
      }
    `;
  }
}
