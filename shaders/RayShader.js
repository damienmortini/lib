export default class RayShader {
  static Ray() {
    return `
      struct Ray
      {
        vec3 origin;
        vec3 direction;
      };
    `
  }
}
