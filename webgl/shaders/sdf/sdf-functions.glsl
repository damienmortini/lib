precision highp float;

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
  // voxel.material *= 1. + dot(normal, normalize(vec3(cos(uTime * 100.), cos(uTime * 100.), sin(uTime * 100.))));

  return voxel;
}


Voxel rayMarchFromCamera(vec2 uv, Camera camera) {
  Ray ray = rayFromCamera(uv, camera);
  Voxel voxel = rayMarch(ray.origin, ray.direction, uCamera.near, uCamera.far);
  return voxel;
}

Voxel rayMarchTerrain(vec3 rayOrigin, vec3 rayDirection)
{
  Voxel voxel = Voxel(uCamera.far, vec4(0.0));

  float lastHeight = 0.;
  float lastY = 0.;

  float dist = 0.;

  float steps = 200.;
  float step = pow(steps, 1./steps);
  // const float step = 1.0789723114;

  float distToPlane = -dot(rayOrigin, vec3(0., 1., 0.)) / dot(rayDirection, vec3(0., 1., 0.));


  for(float i = 0.; i < 200.; i++) {
    dist = distToPlane - steps + i;
    // dist = pow(step, i);
    vec3 p = rayOrigin + rayDirection * dist;
    float height = height(p);

    if(p.y < height) {
        // interpolate the intersection distance
        // resT = t - dt + dt * (lastHeight - lastY) / (p.y - lastY - h + lastHeight);
        voxel.material = vec4(vec3(p.y / scale), 1.0);
        break;
    }

    // step = 0.01 * dist;
    lastHeight = height;
    lastY = p.y;

    // rayMarchingStep = voxel.dist;
    // dist += rayMarchingStep;
    // voxel.dist = dist;
  }

  // vec3 normal = calcNormal(rayOrigin + rayDirection * dist);
  // voxel.material *= 1. + dot(normal, normalize(vec3(cos(uTime * 100.), cos(uTime * 100.), sin(uTime * 100.))));

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
//   gl_FragColor = vec4(voxel.material.rgb, 1.);
//   // gl_FragColor = texture2D(uTexture, position);
// }
