export default {
  vertexChunks: [
    ['start', `
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUV;
      varying vec3 vWorldPosition;
      varying vec3 vViewDirection;
      varying float vFresnel;
    `],
    ['end', `
      vec3 worldPosition = (modelMatrix * vec4(position, 1.)).xyz;
      gl_Position = projectionMatrix * viewMatrix * vec4(worldPosition, 1.);
      
      vWorldPosition = worldPosition;
      vViewDirection = normalize(worldPosition - cameraPosition);
      vPosition = position;
      vNormal = normalize(mat3(modelMatrix) * normal);
      vUV = uv;
      vFresnel = max(0., 1. - dot(-vViewDirection, vNormal));
    `],
  ],
  fragmentChunks: [
    ['start', `
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUV;
      varying vec3 vWorldPosition;
      varying vec3 vViewDirection;
      varying float vFresnel;
    `],
  ],
};
