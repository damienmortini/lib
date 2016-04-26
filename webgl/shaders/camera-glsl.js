export default function() {
  return `
struct Camera
{
  float near;
  float far;
  float fov;
  float aspect;
  mat4 worldInverseMatrix;
  mat4 projectionMatrix;
};

Ray rayFromCamera(vec2 uv, Camera camera) {
  vec2 position = uv * 2. - 1.;

  float fovScaleY = tan(camera.fov * .5);

  vec3 vCameraForward = vec3(0.0, 0.0, -1.0) * mat3(camera.worldInverseMatrix);

  vec3 rayOrigin = -(camera.worldInverseMatrix[3].xyz) * mat3(camera.worldInverseMatrix);
  vec3 rayDirection = normalize(vec3(position.x * fovScaleY * camera.aspect, position.y * fovScaleY, -1.0) * mat3(camera.worldInverseMatrix));

  return Ray(rayOrigin, rayDirection);
}
`};
