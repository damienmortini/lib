struct Camera
{
  float near;
  float far;
  float fov;
  float aspect;
  mat4 matrixWorldInverse;
};

struct Voxel
{
  float dist;
  vec4 color;
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

  vec3 rayOrigin = -(camera.matrixWorldInverse[3].xyz) * mat3(camera.matrixWorldInverse);
  vec3 rayDirection = camera.matrixWorldInverse * camera.projectionMatrix * normalize(vec3(position, .5));

  return Ray(rayOrigin, rayDirection);
}

vec3 normalFromPosition(vec3 p) {
  vec2 e = vec2(.0001, 0.0);
  return normalize(vec3(
    map(p + e.xyy).dist - map(p - e.xyy).dist,
    map(p + e.yxy).dist - map(p - e.yxy).dist,
    map(p + e.yyx).dist - map(p - e.yyx).dist
  ));
}

Voxel rayMarch(vec3 rayOrigin, vec3 rayDirection, float near, float far)
{
  Voxel voxel = Voxel(far, vec4(0.0));

  float rayMarchingStep = 0.001;
  float dist = near;

  for(int i = 0; i < 16; i++) {
    if (rayMarchingStep < 0.001 || rayMarchingStep > far) break;
    voxel = map(rayOrigin + rayDirection * dist);
    rayMarchingStep = voxel.dist;
    dist += rayMarchingStep;
    voxel.dist = dist;
  }

  // vec3 normal = calcNormal(rayOrigin + rayDirection * dist);
  // voxel.color *= 1. + dot(normal, normalize(vec3(cos(uTime * 100.), cos(uTime * 100.), sin(uTime * 100.))));

  return voxel;
}


Voxel rayMarchFromCamera(Camera camera) {
  Ray ray = rayFromCamera(camera);
  Voxel voxel = rayMarch(ray.origin, ray.direction);
  return voxel;
}


// void main()
// {
  // float fovScaleY = tan(camera.fov * .5);
  // float aspect = uResolution.x / uResolution.y;
  //
  // vec2 position = ( gl_FragCoord.xy / uResolution.xy ) * 2. - 1.;
  //
  // vec3 rayOrigin = -( camera.modelViewMatrix[3].xyz ) * mat3( camera.modelViewMatrix );
  // vec3 rayDirection = normalize(vec3(position.x * fovScaleY * aspect, position.y * fovScaleY, -1.0) * mat3( camera.modelViewMatrix ));
//
//   Ray ray = rayFromCamera
//
//   Voxel voxel = rayMarch(rayOrigin, rayDirection);
//
//   gl_FragColor = vec4(voxel.color.rgb, 1.);
//   // gl_FragColor = texture2D(uTexture, position);
// }
