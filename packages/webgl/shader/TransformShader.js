export const rotate = () => {
  return `
    vec2 rotate(vec2 position, float angle, vec2 pivot) {
      float s = sin(angle);
      float c = cos(angle);
      mat2 m = mat2(c, -s, s, c);
      return m * (position - pivot) + pivot;
    }

    vec2 rotate(vec2 position, float angle) {
      float s = sin(angle);
      float c = cos(angle);
      mat2 m = mat2(c, -s, s, c);
      return m * position;
    }
  `
}

// https://twistedpairdevelopment.wordpress.com/2013/02/11/rotating-a-vector-by-a-quaternion-in-glsl/
export const rotatePositionWithQuaternion = () => {
  return `
    vec3 rotatePositionWithQuaternion( vec3 position, vec4 quaternion )
    {
      return position + 2.0 * cross( cross( position, quaternion.xyz ) + quaternion.w * position, quaternion.xyz );
    }
  `
}

// https://github.com/glslify/glsl-look-at
export const rotationMatrixFromDirection = () => {
  return `
    mat3 rotationMatrixFromDirection(vec3 direction, vec3 up) {
      vec3 xaxis = normalize(cross(direction, up));
      vec3 yaxis = normalize(cross(xaxis, direction));
      return mat3(xaxis, yaxis, -direction);
    }
  `
}

export const quaternionFromMatrix = () => {
  return `
    vec4 quaternionFromMatrix(mat4 m) {
      float tr = m[0][0] + m[1][1] + m[2][2];
      vec4 q = vec4(0.);
      if (tr > 0.)
      {
        float s = sqrt(tr + 1.0) * 2.; // S=4*qw 
        q.w = 0.25 * s;
        q.x = (m[2][1] - m[1][2]) / s;
        q.y = (m[0][2] - m[2][0]) / s;
        q.z = (m[1][0] - m[0][1]) / s;
      }
      else if ((m[0][0] > m[1][1]) && (m[0][0] > m[2][2]))
      {
        float s = sqrt(1.0 + m[0][0] - m[1][1] - m[2][2]) * 2.; // S=4*qx 
        q.w = (m[2][1] - m[1][2]) / s;
        q.x = 0.25 * s;
        q.y = (m[0][1] + m[1][0]) / s;
        q.z = (m[0][2] + m[2][0]) / s;
      }
      else if (m[1][1] > m[2][2])
      {
        float s = sqrt(1.0 + m[1][1] - m[0][0] - m[2][2]) * 2.; // S=4*qy
        q.w = (m[0][2] - m[2][0]) / s;
        q.x = (m[0][1] + m[1][0]) / s;
        q.y = 0.25 * s;
        q.z = (m[1][2] + m[2][1]) / s;
      }
      else
      {
        float s = sqrt(1.0 + m[2][2] - m[0][0] - m[1][1]) * 2.; // S=4*qz
        q.w = (m[1][0] - m[0][1]) / s;
        q.x = (m[0][2] + m[2][0]) / s;
        q.y = (m[1][2] + m[2][1]) / s;
        q.z = 0.25 * s;
      }
      return q;
    }
  `
}

export const matrixFromQuaternion = () => {
  return `
    mat3 matrixFromQuaternion(vec4 quaternion) {
      float x2 = quaternion.x + quaternion.x;
      float y2 = quaternion.y + quaternion.y;
      float z2 = quaternion.z + quaternion.z;
      float xx = quaternion.x * x2;
      float yx = quaternion.y * x2;
      float yy = quaternion.y * y2;
      float zx = quaternion.z * x2;
      float zy = quaternion.z * y2;
      float zz = quaternion.z * z2;
      float wx = quaternion.w * x2;
      float wy = quaternion.w * y2;
      float wz = quaternion.w * z2;
      return mat3(1. - yy - zz, yx - wz, zx + wy, yx + wz, 1. - xx - zz, zy - wx, zx - wy, zy + wx, 1. - xx - yy);
    }
  `
}

export const matrixFromAxisAngle = () => {
  return `
    mat3 matrixFromAxisAngle(vec3 axis, float angle)
    {
        axis = normalize(axis);
        float s = sin(angle);
        float c = cos(angle);
        float oc = 1.0 - c;
        
        return mat3(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
                    oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
                    oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c);
    }
  `
}

export const matrixFromEuler = () => {
  return `
    mat3 matrixFromEuler(vec3 eulerRotation) {
      float x = eulerRotation.x; 
      float y = eulerRotation.y;
      float z = eulerRotation.z;
      float a = cos(x);
      float b = sin(x);
      float c = cos(y);
      float d = sin(y);
      float e = cos(z);
      float f = sin(z);

      float ae = a * e;
      float af = a * f;
      float be = b * e;
      float bf = b * f;

      return mat3(c * e, af + be * d, bf - ae * d, - c * f, ae - bf * d, be + af * d, d, - b * c, a * c);
    }
  `
}
