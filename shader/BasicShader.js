export default class BasicShader {
  constructor({
    positions = true,
    normals = true,
    uvs = true
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

      ${this._positions ? "in vec3 position;\n" : ""}${this._normals ? "in vec3 normal;\n" : ""}${this._uvs ? "in vec2 uv;\n" : ""}

      ${this._positions ? "out vec3 vPosition;\n" : ""}${this._normals ? "out vec3 vNormal;\n" : ""}${this._uvs ? "out vec2 vUv;\n" : ""}
      `
      ],
      ["main", `
      ${this._positions ? "vPosition = position;\n" : ""}${this._normals ? "vNormal = normal;\n" : ""}${this._uvs ? "vUv = uv;\n" : ""}
      `
      ],
      ["end", `
      gl_Position = projectionView * transform * vec4(position, 1.);
      `
      ]
    ]
  }

  get fragmentShaderChunks() {
    return [
      ["start", `
      ${this._positions ? "in vec3 vPosition;\n" : ""}${this._normals ? "in vec3 vNormal;\n" : ""}${this._uvs ? "in vec2 vUv;\n" : ""}
      `
      ]
    ];
  }
}
