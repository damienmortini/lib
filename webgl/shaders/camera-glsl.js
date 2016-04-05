export default function() {
  return `
struct Camera
{
  float near;
  float far;
  float fov;
  float aspect;
  mat4 modelViewMatrix;
};

Ray rayFromCamera(vec2 uv, Camera camera) {
  vec2 position = uv * 2. - 1.;

  float fovScaleY = tan(camera.fov * .5);

  vec3 vCameraForward = vec3(0.0, 0.0, -1.0) * mat3(camera.modelViewMatrix);

  vec3 rayOrigin = -(camera.modelViewMatrix[3].xyz) * mat3(camera.modelViewMatrix);
  vec3 rayDirection = normalize(vec3(position.x * fovScaleY * camera.aspect, position.y * fovScaleY, -1.0) * mat3(camera.modelViewMatrix));

  return Ray(rayOrigin, rayDirection);
}
`};
