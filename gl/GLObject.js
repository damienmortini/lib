import GLMesh from "./GLMesh.js";
import GLProgram from "./GLProgram.js";
import GLVertexArray from "./GLVertexArray.js";
import GLTexture from "./GLTexture.js";

export default class GLObject {
  constructor({
    gl,
    mesh = new GLMesh(),
    program = new GLProgram(),
    vertexArray = new GLVertexArray({
      gl,
      mesh,
      program,
    }),
  } = { gl }) {
    this.gl = gl;
    this.mesh = mesh;
    this.program = program;
    this.vertexArray = vertexArray;

    this._boundTextures = new Set();
  }

  bind() {
    this.program.use();
    this.vertexArray.bind();
    let unit = 0;
    for (const [name, type] of this.program.uniformTypes) {
      if (type.startsWith("sampler")) {
        const value = this.program.uniforms.get(name);
        if (value instanceof GLTexture) {
          value.bind({
            unit,
          });
          this._boundTextures.add(value);
        }
        unit++;
      }
    }
  }

  draw({ bind = true, uniforms = {}, ...options } = {}) {
    if (bind) {
      this.bind();
    }
    for (const uniform in uniforms) {
      this.program.uniforms.set(uniform, uniforms[uniform]);
    }
    this.mesh.draw(options);
  }

  unbind() {
    this.vertexArray.unbind();
    for (const texture of this._boundTextures) {
      texture.unbind();
    }
  }
}
