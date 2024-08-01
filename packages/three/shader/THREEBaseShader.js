export default {
  vertexChunks: [
    ['start', `
      out vec3 vPosition;
      out vec3 vNormal;
      out vec2 vUV;
      out vec3 vWorldPosition;
      out vec3 vViewDirection;
      out float vFresnel;
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
      in vec3 vPosition;
      in vec3 vNormal;
      in vec2 vUV;
      in vec3 vWorldPosition;
      in vec3 vViewDirection;
      in float vFresnel;
    `],
  ],
};
