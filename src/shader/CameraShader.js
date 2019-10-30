export default class CameraShader {
  static get Camera() {
    return `
      struct Camera
      {
        float near;
        float far;
        float fov;
        float aspectRatio;
        mat4 transform;
        mat4 inverseTransform;
        mat4 projection;
        mat4 projectionView;
      };
    `;
  }
}
