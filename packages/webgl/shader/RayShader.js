export const Ray = `
  struct Ray
  {
    vec3 origin;
    vec3 direction;
  };
`

export const rayFromCamera = () => {
  return `
    Ray rayFromCamera(vec2 coord, mat4 cameraInverseTransform, float fov, float aspectRatio) {
      float fovScaleY = tan(fov * .5);

      vec3 rayOrigin = -cameraInverseTransform[3].xyz * mat3(cameraInverseTransform);
      vec3 rayDirection = normalize(vec3(coord.x * fovScaleY * aspectRatio, coord.y * fovScaleY, -1.0) * mat3(cameraInverseTransform));

      return Ray(rayOrigin, rayDirection);
    }
  `
}
