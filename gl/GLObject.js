import GLVertexArray from "./GLVertexArray.js";
import GLTexture from "./GLTexture.js";

export default class GLObject {
  constructor({
    gl,
    mesh = undefined,
    program = undefined,
    vertexArray = new GLVertexArray({
      gl,
      mesh,
      program,
    }),
  }) {
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
    for (const name in this.program.uniformTypes) {
      if (this.program.uniformTypes[name].startsWith("sampler")) {
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

  draw(options) {
    options = Object.assign({ bind: true, uniforms: {} }, options);
    // Todo: Fix double call to Program.use when bind is true
    // (needed to update texture uniforms before binding them)
    this.program.use();
    for (const uniform in options.uniforms) {
      this.program.uniforms.set(uniform, options.uniforms[uniform]);
    }
    if (options.bind) {
      this.bind();
    }
    this.mesh.draw(options);
    if (options.bind) {
      this.unbind();
    }
  }

  unbind() {
    this.vertexArray.unbind();
    for (const texture of this._boundTextures) {
      texture.unbind();
      this._boundTextures.delete(texture);
    }
  }
}
