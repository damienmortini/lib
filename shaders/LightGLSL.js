export default class LightGLSL {
  static structure() {
    return `
      struct Light
      {
        vec3 color;
        vec3 direction;
      };
    `
  }
}
