export default class LUTShader {
  static computeLUT({
    lutSize = 64,
  } = {}) {
    const lutTextureSize = lutSize * Math.sqrt(lutSize);
    return `
      vec3 computeLUT(vec3 color, sampler2D lutTexture, vec4 lutRectangle)
      {
        float x = color.r * ${(lutSize - 1)}.;
        float y = color.g * ${(lutSize - 1)}.;
        float z = color.b * ${(lutSize - 1)}.;

        float previousZ = floor(z);
        float nextZ = ceil(z);

        vec2 quad1 = vec2(mod(previousZ, 8.), floor(previousZ / 8.));
        vec2 quad2 = vec2(mod(nextZ, 8.), floor(nextZ / 8.));

        vec2 previousUV;
        previousUV.x = lutRectangle.x + ((quad1.x * ${lutSize}.) + x) / ${lutTextureSize}. * lutRectangle.z;
        previousUV.y = lutRectangle.y + ((quad1.y * ${lutSize}.) + y) / ${lutTextureSize}. * lutRectangle.w;

        vec2 nextUV;
        nextUV.x = lutRectangle.x + ((quad2.x * ${lutSize}.) + x) / ${lutTextureSize}. * lutRectangle.z;
        nextUV.y = lutRectangle.y + ((quad2.y * ${lutSize}.) + y) / ${lutTextureSize}. * lutRectangle.w;

        vec3 newColor1 = texture2D(lutTexture, previousUV).rgb;
        vec3 newColor2 = texture2D(lutTexture, nextUV).rgb;

        vec3 newColor = mix(newColor1, newColor2, fract(z));
        return newColor;
      }

      vec3 computeLUT(vec3 color, sampler2D lutTexture) {
        return computeLUT(color, lutTexture, vec4(0., 0., 1., 1.));
      }
    `;
  }
}
