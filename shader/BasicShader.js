import Shader from "../3d/Shader.js";

export default class BasicShader extends Shader {
  constructor({
    positions = true,
    normals = true,
    uvs = true,
    uniforms = undefined,
    vertexShaderChunks = [],
    fragmentShaderChunks = [],
    shaders = [],
  } = {}) {
    super({
      uniforms,
      vertexShaderChunks: [
        ["start", `
          uniform mat4 projectionView;
          uniform mat4 transform;
  
          ${positions ? "in vec3 position;" : ""}
          ${normals ? "in vec3 normal;" : ""}
          ${uvs ? "in vec2 uv;" : ""}
  
          ${positions ? "out vec3 vPosition;" : ""}
          ${normals ? "out vec3 vNormal;" : ""}
          ${uvs ? "out vec2 vUV;" : ""}
        `],
        ["main", `
          ${positions ? "vPosition = position;" : ""}
          ${normals ? "vNormal = normal;" : ""}
          ${uvs ? "vUV = uv;" : ""}
        `],
        ["end", `
          gl_Position = projectionView * transform * vec4(position, 1.);
        `],
        ...vertexShaderChunks,
      ],
      fragmentShaderChunks: [
        ["start", `
          ${positions ? "in vec3 vPosition;" : ""}
          ${normals ? "in vec3 vNormal;" : ""}
          ${uvs ? "in vec2 vUV;" : ""}
        `],
        ...fragmentShaderChunks,
      ],
      shaders,
    });
  }
}
