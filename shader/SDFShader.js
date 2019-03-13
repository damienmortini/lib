export default class SDFShader {
  static get Voxel() {
    return `
      struct Voxel
      {
        vec4 coord;
        vec4 material;
      };
    `;
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

  static sdfSmoothMin() {
    return `
      Voxel sdfSmoothMin(Voxel voxel1, Voxel voxel2, float blend) {
        float ratio = clamp(.5 + .5 * (voxel2.coord.w - voxel1.coord.w) / blend, 0., 1.);
    
        vec4 coord = mix(voxel2.coord, voxel1.coord, ratio) - blend * ratio * (1. - ratio);
        vec4 material = mix(voxel2.material, voxel1.material, ratio);
    
        return Voxel(coord, material);
      }
    `;
  }

  static sdfMin() {
    return `
    Voxel sdfMin(Voxel voxel1, Voxel voxel2) {
      if(voxel1.coord.w < voxel2.coord.w) {
        return voxel1;
      }
      else {
        return voxel2;
      }
    }
    `;
  }

  static sdfTransform() {
    return `
    vec3 sdfTransform(vec3 position, mat4 transform) {
      position = inverse(transform) * position;
      return position;
    }
    `;
  }

  static sdfSubstraction() {
    return `
      Voxel sdfSubstraction(Voxel voxel1, Voxel voxel2)
      {
        voxel1.coord.w = max(-voxel2.coord.w, voxel1.coord.w);
        voxel1.material = mix(voxel1.material, voxel2.material, step(voxel1.coord.w, -voxel2.coord.w));
        return voxel1;
      }
    `;
  }

  static sdfRepeat() {
    return `
      float sdfRepeat(float p, float c) {
        return mod(p,c) - 0.5 * c;
      }

      vec2 sdfRepeat(vec2 p, vec2 c) {
        return mod(p,c) - 0.5 * c;
      }

      vec3 sdfRepeat(vec3 p, vec3 c) {
        return mod(p,c) - 0.5 * c;
      }
    `;
  }

  // http://iquilezles.org/www/articles/normalsSDF/normalsSDF.htm
  static sdfNormalFromPosition({
    name = "sdfNormalFromPosition",
    mapName = "map",
    preventInline = false,
  } = {}) {
    if (preventInline) {
      return `
        vec3 ${name}(vec3 position, float epsilon)
        {
          #define ZERO (min(int(epsilon),0)) // or any other non constant and cheap expression that is guaranteed to evaluate to zero
          vec3 n = vec3(0.0);
          for( int i=ZERO; i<4; i++ )
          {
            vec3 e = 0.5773*(2.0*vec3((((i+3)>>1)&1),((i>>1)&1),(i&1))-1.0);
            n += e*${mapName}(position+e*epsilon).coord.w;
          }
          return normalize(n);
        }
      `;
    } else {
      return `
        vec3 ${name}(vec3 position, float epsilon)
        {
            const vec2 k = vec2(1,-1);
            return normalize( k.xyy*${mapName}( position + k.xyy*epsilon ).coord.w + 
                              k.yyx*${mapName}( position + k.yyx*epsilon ).coord.w + 
                              k.yxy*${mapName}( position + k.yxy*epsilon ).coord.w + 
                              k.xxx*${mapName}( position + k.xxx*epsilon ).coord.w );
        }
      `;
    }
  }

  static sdfRayMarch({
    name = "sdfRayMarch",
    mapName = "map",
    maxSteps = 512,
  } = {}) {
    return `
      Voxel ${name}(Ray ray, float near, float far, int steps, float distancePrecision)
      {
        Voxel voxel;

        float rayMarchingStep = far;
        float distance = near;

        // TODO: Remove use of maxsteps and just use step when WebGL2 is broadly supported
        
        for(int i = 0; i < ${maxSteps}; i++) {
          if (i == steps || rayMarchingStep < distancePrecision || distance > far) break;
          voxel = ${mapName}(ray.origin + ray.direction * distance);
          rayMarchingStep = voxel.coord.w;
          distance += rayMarchingStep;
        }

        voxel.coord.xyz = ray.origin + ray.direction * distance;
        voxel.coord.w = distance;
        voxel = sdfMin(voxel, Voxel(vec4(0., 0., 0., far), vec4(0.)));

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
