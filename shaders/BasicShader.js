export default class BasicShader {
  constructor({
    position = true,
    normal = true,
    uv = true
  }) {
    this._position = !!position;
    this._normal = !!normal;
    this._uv = !!uv;
  }

  get vertexShaderChunks() {
    return [
      ["start", `
      uniform mat4 projectionView;
      uniform mat4 transform;

      ${this._position ? "in vec3 position;\n" : ""}${this._normal ? "in vec3 normal;\n" : ""}${this._uv ? "in vec2 uv;\n" : ""}

      ${this._position ? "out vec3 vPosition;\n" : ""}${this._normal ? "out vec3 vNormal;\n" : ""}${this._uv ? "out vec2 vUv;\n" : ""}
      `
      ],
      ["main", `
      ${this._position ? "vPosition = position;\n" : ""}${this._normal ? "vNormal = normal;\n" : ""}${this._uv ? "vUv = uv;\n" : ""}
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
      ${this._position ? "in vec3 vPosition;\n" : ""}${this._normal ? "in vec3 vNormal;\n" : ""}${this._uv ? "in vec2 vUv;\n" : ""}
      `
      ]
    ];
  }
}
