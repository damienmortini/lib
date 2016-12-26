export default class LightGLSL {
  static structure() {
    return `
      struct Ray
      {
        vec3 origin;
        vec3 direction;
      };
    `
  }
}
