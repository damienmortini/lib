export default class MappingShader {
  static directionToEquirectangularUV() {
    return `
      vec2 directionToEquirectangularUV(vec3 direction) {
        float u = atan(-direction.z, direction.x) * 0.15915494309189535 + .5;
        float v = asin(clamp(direction.y, -1., 1.)) * 0.3183098861837907 + .5;
        return vec2(u, v);
      }
    `;
  }
}
