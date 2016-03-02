precision highp float;

struct Camera
{
  float near;
  float far;
  float fov;
  float aspect;
  mat4 modelViewMatrix;
};

struct Ray
{
  vec3 origin;
  vec3 direction;
};

Ray rayFromCamera(vec2 uv, Camera camera) {
  float fovScaleY = tan(camera.fov * .5);

  vec3 vCameraForward = vec3( 0.0, 0.0, -1.0) * mat3( camera.modelViewMatrix );

  vec3 rayOrigin = -(camera.modelViewMatrix[3].xyz) * mat3(camera.modelViewMatrix);
  vec3 rayDirection = normalize(vec3(uv.x * fovScaleY * camera.aspect, uv.y * fovScaleY, -1.0) * mat3(camera.modelViewMatrix));

  // vec3 rayOrigin = -(camera.matrixWorldInverse[3].xyz) * mat3(camera.matrixWorldInverse);
  // vec3 rayDirection = camera.matrixWorldInverse * camera.projectionMatrix * normalize(vec3(position, .5));

  return Ray(rayOrigin, rayDirection);
}
