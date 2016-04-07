export default function({map, steps = 64}) {

  return `
// STRUCTURES

struct Voxel
{
  float dist;
  vec4 material;
};

// PRIMITIVES

float sdBox( vec3 p, vec3 b )
{
  vec3 d = abs(p) - b;
  return min(max(d.x,max(d.y,d.z)),0.0) +
         length(max(d,0.0));
}

float udBox( vec3 p, vec3 b )
{
  return length(max(abs(p)-b,0.0));
}

float sdSphere( vec3 p, float s )
{
  return length(p)-s;
}

// OPERATORS

Voxel smin( Voxel voxel1, Voxel voxel2, float blendRatio )
{
  float ratio = clamp(.5 + .5 * (voxel2.dist - voxel1.dist) / blendRatio, 0., 1.);

  float dist = mix(voxel2.dist, voxel1.dist, ratio) - blendRatio * ratio * (1. - ratio);
  vec4 material = mix(voxel2.material, voxel1.material, ratio);

  return Voxel(dist, material);
}

Voxel min( Voxel voxel1, Voxel voxel2 )
{
  if(voxel1.dist - voxel2.dist < 0.) {
    return voxel1;
  }
  else {
    return voxel2;
  }
}

vec3 repeat( vec3 p, vec3 c )
{
    return mod(p,c)-0.5*c;
}

// METHODS

${map}

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

  for(int i = 0; i < ${steps}; i++) {
    if (rayMarchingStep < 0.0001 || rayMarchingStep > far) break;
    voxel = map(rayOrigin + rayDirection * dist);
    rayMarchingStep = voxel.dist;
    dist += rayMarchingStep;
    voxel.dist = dist;
  }

  return voxel;
}


Voxel rayMarchFromCamera(vec2 uv, Camera camera) {
  Ray ray = rayFromCamera(uv, camera);
  Voxel voxel = rayMarch(ray.origin, ray.direction, camera.near, camera.far);
  return voxel;
}

// Voxel rayMarchTerrain(vec3 rayOrigin, vec3 rayDirection)
// {
//   Voxel voxel = Voxel(uCamera.far, vec4(0.0));
//
//   float lastHeight = 0.;
//   float lastY = 0.;
//
//   float dist = 0.;
//
//   float steps = 200.;
//   float step = pow(steps, 1./steps);
//   // const float step = 1.0789723114;
//
//   float distToPlane = -dot(rayOrigin, vec3(0., 1., 0.)) / dot(rayDirection, vec3(0., 1., 0.));
//
//
//   for(float i = 0.; i < 200.; i++) {
//     dist = distToPlane - steps + i;
//     // dist = pow(step, i);
//     vec3 p = rayOrigin + rayDirection * dist;
//     float height = height(p);
//
//     if(p.y < height) {
//         // interpolate the intersection distance
//         // resT = t - dt + dt * (lastHeight - lastY) / (p.y - lastY - h + lastHeight);
//         voxel.material = vec4(vec3(p.y / scale), 1.0);
//         break;
//     }
//
//     // step = 0.01 * dist;
//     lastHeight = height;
//     lastY = p.y;
//
//     // rayMarchingStep = voxel.dist;
//     // dist += rayMarchingStep;
//     // voxel.dist = dist;
//   }
//
//   // vec3 normal = calcNormal(rayOrigin + rayDirection * dist);
//   // voxel.material *= 1. + dot(normal, normalize(vec3(cos(uTime * 100.), cos(uTime * 100.), sin(uTime * 100.))));
//
//   return voxel;
// }
`};
