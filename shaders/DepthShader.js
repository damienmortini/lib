export default class DepthShader {
  static pack() {
    return `
      vec4 pack (float depth) {
        const vec4 bitSh = vec4(256 * 256 * 256, 256 * 256, 256, 1.0);
        const vec4 bitMsk = vec4(0, 1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0);
        vec4 comp = fract(depth * bitSh);
        comp -= comp.xxyz * bitMsk;
        return comp;
      }
    `;
  }

  static unpack() {
    return `
      float unpack (vec4 packedDepth) {
        const vec4 bitShifts = vec4(1.0 / (256.0 * 256.0 * 256.0), 1.0 / (256.0 * 256.0), 1.0 / 256.0, 1);
        return dot(packedDepth, bitShifts);
      }
    `;
  }

  static bumpFromDepth ({
    getDepth = "return texture(depthTexture, uv).r;"
  } = {}) {
    return `
      float getDepth(sampler2D depthTexture, vec2 uv) {
        ${getDepth}
      }
    
      vec4 bumpFromDepth(sampler2D depthTexture, vec2 uv, vec2 resolution, float scale) {
        vec2 step = 1. / resolution;
          
        float height = getDepth(depthTexture, uv);
          
        vec2 dxy = height - vec2(
            getDepth(depthTexture, uv + vec2(step.x, 0.)), 
            getDepth(depthTexture, uv + vec2(0., step.y))
        );
          
        return vec4(normalize(vec3(dxy * scale / step, 1.)), height);
      }
    `;
  }
}
