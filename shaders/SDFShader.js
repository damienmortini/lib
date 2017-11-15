export default class SDFShader {
  static Voxel() {
    return `
      struct Voxel
      {
        vec4 coord;
        vec4 material;
      };
    `
  }

  static sdfBox() {
    return `
      Voxel sdfBox(vec3 position, vec3 box, vec4 material) {
        return Voxel(vec4(position, length(max(abs(position) - box, 0.0))), material);
      }
    `;
  }

  static sdfEllipsoid() {
    return `
      Voxel sdfEllipsoid(vec3 position, vec3 box, vec4 material) {
        return Voxel(vec4(position, (length(position / box) - 1.0) * min(min(box.x, box.y), box.z)), material);
      }
    `;
  }

  static sdfSphere() {
    return `
      Voxel sdfSphere(vec3 position, float radius, vec4 material) {
        return Voxel(vec4(position, length(position) - radius), material);
      }
    `;
  }

  static smoothMin() {
    return `
      Voxel smoothMin(Voxel voxel1, Voxel voxel2, float blendRatio) {
        float ratio = clamp(.5 + .5 * (voxel2.coord.w - voxel1.coord.w) / blendRatio, 0., 1.);
    
        vec4 coord = mix(voxel2.coord, voxel1.coord, ratio) - blendRatio * ratio * (1. - ratio);
        vec4 material = mix(voxel2.material, voxel1.material, ratio);
    
        return Voxel(coord, material);
      }
    `;
  }

  static min() {
    return `
    Voxel min(Voxel voxel1, Voxel voxel2) {
      if(voxel1.coord.w < voxel2.coord.w) {
        return voxel1;
      }
      else {
        return voxel2;
      }
    }
    `;
  }
  
  static substraction() {
    return `
      Voxel substraction(Voxel voxel1, Voxel voxel2)
      {
        voxel1.coord.w = max(-voxel2.coord.w, voxel1.coord.w);
        return voxel1;
      }
    `
  }

  static repeat() {
    return `
      float repeat(float p, float c) {
        return mod(p,c) - 0.5 * c;
      }

      vec2 repeat(vec2 p, vec2 c) {
        return mod(p,c) - 0.5 * c;
      }

      vec3 repeat(vec3 p, vec3 c) {
        return mod(p,c) - 0.5 * c;
      }
    `;
  }

  static rayMarch({
    map = `
      Voxel voxel = Voxel(0., vec4(0.));
      return voxel;
    `,
    maxSteps = 128
  } = {}) {
    return `
      Voxel map(vec3 position) {
        ${map}
      }

      vec3 normalFromPosition(vec3 position) {
        vec2 e = vec2(.01, 0.0);
        return normalize(vec3(
          map(position + e.xyy).coord.w - map(position - e.xyy).coord.w,
          map(position + e.yxy).coord.w - map(position - e.yxy).coord.w,
          map(position + e.yyx).coord.w - map(position - e.yyx).coord.w
        ));
      }

      Voxel rayMarch(Ray ray, float near, float far, int steps)
      {
        Voxel voxel;

        float rayMarchingStep = far;
        float distance = near;

        for(int i = 0; i < ${maxSteps}; i++) {
          if (i == steps || rayMarchingStep < 0.0001 || distance > far) break;
          voxel = map(ray.origin + ray.direction * distance);
          rayMarchingStep = voxel.coord.w;
          distance += rayMarchingStep;
        }

        voxel.coord.w = distance;
        voxel = min(voxel, Voxel(vec4(0., 0., 0., far), vec4(0.)));

        return voxel;
      }

      Voxel rayMarchFromCamera(vec2 position, Camera camera, int steps) {
        Ray ray = rayFromCamera(position, camera);
        Voxel voxel = rayMarch(ray, camera.near, camera.far, steps);
        return voxel;
      }
    `;
  }
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
//     // rayMarchingStep = voxel.coord.w;
//     // distance += rayMarchingStep;
//     // voxel.coord.w = distance;
//   }
//
//   // vec3 normal = calcNormal(rayOrigin + rayDirection * distance);
//   // voxel.material *= 1. + dot(normal, normalize(vec3(cos(uTime * 100.), cos(uTime * 100.), sin(uTime * 100.))));
//
//   return voxel;
// }