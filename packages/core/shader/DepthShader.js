export const pack = () => {
  return `
      vec4 pack (float depth) {
        const vec4 bitSh = vec4(256 * 256 * 256, 256 * 256, 256, 1.0);
        const vec4 bitMsk = vec4(0, 1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0);
        vec4 comp = fract(depth * bitSh);
        comp -= comp.xxyz * bitMsk;
        return comp;
      }
    `
}

export const unpack = () => {
  return `
      float unpack (vec4 packedDepth) {
        const vec4 bitShifts = vec4(1.0 / (256.0 * 256.0 * 256.0), 1.0 / (256.0 * 256.0), 1.0 / 256.0, 1);
        return dot(packedDepth, bitShifts);
      }
    `
}

export const bumpFromDepth = ({
  getDepthFunctionName = 'getDepth',
} = {}) => {
  return `
      vec4 bumpFromDepth(sampler2D depthTexture, vec2 uv, vec2 resolution, float scale) {
        vec2 step = 1. / resolution;
          
        float depth = texture(depthTexture, uv).r;
          
        vec2 dxy = depth - vec2(
            texture(depthTexture, uv + vec2(step.x, 0.)).r,
            texture(depthTexture, uv + vec2(0., step.y)).r
        );
        
        return vec4(depth, normalize(vec3(dxy * scale / step, 1.)));
      }
    
      vec4 bumpFromDepth(vec2 uv, vec2 resolution, float scale) {
        vec2 step = 1. / resolution;
          
        float depth = ${getDepthFunctionName}(uv);
          
        vec2 dxy = depth - vec2(
            ${getDepthFunctionName}(uv + vec2(step.x, 0.)), 
            ${getDepthFunctionName}(uv + vec2(0., step.y))
        );
          
        return vec4(depth, normalize(vec3(dxy * scale / step, 1.)));
      }
    `
}
