export default class BasicShader {
  constructor({
    positions = true,
    normals = true,
    uvs = true,
  } = {}) {
    this._positions = !!positions;
    this._normals = !!normals;
    this._uvs = !!uvs;
  }

  get vertexShaderChunks() {
    return [
      ["start", `
        uniform mat4 projectionView;
        uniform mat4 transform;

        ${this._positions ? "in vec3 position;" : ""}
        ${this._normals ? "in vec3 normal;" : ""}
        ${this._uvs ? "in vec2 uv;" : ""}

        ${this._positions ? "out vec3 vPosition;" : ""}
        ${this._normals ? "out vec3 vNormal;" : ""}
        ${this._uvs ? "out vec2 vUv;" : ""}
      `],
      ["main", `
        ${this._positions ? "vPosition = position;" : ""}
        ${this._normals ? "vNormal = normal;" : ""}
        ${this._uvs ? "vUv = uv;" : ""}
      `],
      ["end", `
        gl_Position = projectionView * transform * vec4(position, 1.);
      `],
    ];
  }

  get fragmentShaderChunks() {
    return [
      ["start", `
        ${this._positions ? "in vec3 vPosition;" : ""}
        ${this._normals ? "in vec3 vNormal;" : ""}
        ${this._uvs ? "in vec2 vUv;" : ""}
      `],
    ];
  }
}
