// https://blog.selfshadow.com/publications/blending-in-detail/
export const blendNormals = () => {
  return `
  vec3 blendNormals(vec3 n1, vec3 n2)
  {
      mat3 nBasis = mat3(
        vec3(n2.z, n2.y, -n2.x), // +90 degree rotation around y axis
        vec3(n2.x, n2.z, -n2.y), // -90 degree rotation around x axis
        vec3(n2.x, n2.y,  n2.z));
      return normalize(n1.x*nBasis[0] + n1.y*nBasis[1] + n1.z*nBasis[2]);
  }
`;
}

// From Three.js
export const perturbNormal = () => {
  return `
    vec3 perturbNormal(vec3 baseNormal, vec3 normal, vec3 viewPosition, vec2 uv) {
      vec3 p = -normalize(viewPosition);

      vec3 dp1 = dFdx(p);
      vec3 dp2 = dFdy(p);
      vec2 duv1 = dFdx(uv);
      vec2 duv2 = dFdy(uv);

      // solve the linear system
      vec3 dp2perp = cross(dp2, baseNormal);
      vec3 dp1perp = cross(baseNormal, dp1);
      vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
      vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;

      // construct a scale-invariant frame 
      float invmax = 1.0 / sqrt(max(dot(T,T), dot(B,B)));
      
      mat3 TBN = mat3(normalize(T * invmax), normalize(B * invmax), baseNormal);

      return normalize(TBN * normal);
    }
  `;
}
