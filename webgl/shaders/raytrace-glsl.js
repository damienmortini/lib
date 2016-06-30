export default function({
  map = `
    Voxel voxel = Voxel(0., vec4(0.));
    return voxel;
  `
} = {}) {

  return `
// STRUCTURES

struct Voxel
{
  float distance;
  vec4 material;
};

// PRIMITIVES

float box( vec3 p, vec3 b )
{
  return length(max(abs(p)-b,0.0));
}

float sphere( vec3 p, float s )
{
  return length(p)-s;
}

float infinitePlane( vec3 p )
{
  return p.y;
}

// OPERATORS

Voxel smin( Voxel voxel1, Voxel voxel2, float blendRatio )
{
  float ratio = clamp(.5 + .5 * (voxel2.distance - voxel1.distance) / blendRatio, 0., 1.);

  float distance = mix(voxel2.distance, voxel1.distance, ratio) - blendRatio * ratio * (1. - ratio);
  vec4 material = mix(voxel2.material, voxel1.material, ratio);

  return Voxel(distance, material);
}

Voxel min( Voxel voxel1, Voxel voxel2 )
{
  if(voxel1.distance - voxel2.distance < 0.) {
    return voxel1;
  }
  else {
    return voxel2;
  }
}

// REPEAT

float repeat( float p, float c )
{
  return mod(p,c)-0.5*c;
}

vec2 repeat( vec2 p, vec2 c )
{
  return mod(p,c)-0.5*c;
}

vec3 repeat( vec3 p, vec3 c )
{
    return mod(p,c)-0.5*c;
}

// METHODS

Voxel map(vec3 p) {
  ${map}
}

vec3 normalFromPosition(vec3 p) {
  vec2 e = vec2(.01, 0.0);
  return normalize(vec3(
    map(p + e.xyy).distance - map(p - e.xyy).distance,
    map(p + e.yxy).distance - map(p - e.yxy).distance,
    map(p + e.yyx).distance - map(p - e.yyx).distance
  ));
}

Voxel rayMarch(Ray ray, float near, float far, int steps)
{
  Voxel voxel;

  float rayMarchingStep = 0.001;
  float distance = near;

  for(int i = 0; i < 128; i++) {
    if (i == steps || rayMarchingStep < 0.0001 || rayMarchingStep > far) break;
    voxel = map(ray.origin + ray.direction * distance);
    rayMarchingStep = voxel.distance;
    distance += rayMarchingStep;
    voxel.distance = distance;
  }

  return voxel;
}

Voxel rayMarchFromCamera(vec2 position, Camera camera, int steps) {
  Ray ray = rayFromCamera(position, camera);
  Voxel voxel = rayMarch(ray, camera.near, camera.far, steps);
  return voxel;
}

// Voxel rayMarchTerrain(vec3 rayOrigin, vec3 rayDirection)
// {
//   Voxel voxel = Voxel(uCamera.far, vec4(0.0));
//
//   float lastHeight = 0.;
//   float lastY = 0.;
//
//   float distance = 0.;
//
//   float steps = 200.;
//   float step = pow(steps, 1./steps);
//   // const float step = 1.0789723114;
//
//   float distanceToPlane = -dot(rayOrigin, vec3(0., 1., 0.)) / dot(rayDirection, vec3(0., 1., 0.));
//
//
//   for(float i = 0.; i < 200.; i++) {
//     distance = distanceToPlane - steps + i;
//     // distance = pow(step, i);
//     vec3 p = rayOrigin + rayDirection * distance;
//     float height = height(p);
//
//     if(p.y < height) {
//         // interpolate the intersection distanceance
//         // resT = t - dt + dt * (lastHeight - lastY) / (p.y - lastY - h + lastHeight);
//         voxel.material = vec4(vec3(p.y / scale), 1.0);
//         break;
//     }
//
//     // step = 0.01 * distance;
//     lastHeight = height;
//     lastY = p.y;
//
//     // rayMarchingStep = voxel.distance;
//     // distance += rayMarchingStep;
//     // voxel.distance = distance;
//   }
//
//   // vec3 normal = calcNormal(rayOrigin + rayDirection * distance);
//   // voxel.material *= 1. + dot(normal, normalize(vec3(cos(uTime * 100.), cos(uTime * 100.), sin(uTime * 100.))));
//
//   return voxel;
// }
`};
