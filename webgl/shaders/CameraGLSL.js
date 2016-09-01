export default class CameraGLSL {
  static structure() {
    return `
      struct Camera
      {
        float near;
        float far;
        float fov;
        float aspect;
        mat4 inverseMatrix;
        mat4 projectionMatrix;
      };
    `
  }

  static rayFromCamera() {
    return `
      Ray rayFromCamera(vec2 position, Camera camera) {
        float fovScaleY = tan(camera.fov * .5);

        vec3 rayOrigin = -camera.inverseMatrix[3].xyz * mat3(camera.inverseMatrix);
        vec3 rayDirection = normalize(vec3(position.x * fovScaleY * camera.aspect, position.y * fovScaleY, -1.0) * mat3(camera.inverseMatrix));

        return Ray(rayOrigin, rayDirection);
      }
    `;
  }
}
