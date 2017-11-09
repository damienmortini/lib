export default class CameraShader {
  static Camera() {
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
    `
  }

  static rayFromCamera() {
    return `
      Ray rayFromCamera(vec2 position, Camera camera) {
        float fovScaleY = tan(camera.fov * .5);

        vec3 rayOrigin = -camera.inverseTransform[3].xyz * mat3(camera.inverseTransform);
        vec3 rayDirection = normalize(vec3(position.x * fovScaleY * camera.aspectRatio, position.y * fovScaleY, -1.0) * mat3(camera.inverseTransform));

        return Ray(rayOrigin, rayDirection);
      }
    `;
  }
}
