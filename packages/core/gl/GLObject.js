import GLVertexArray from './GLVertexArray.js';
import GLTexture from './GLTexture.js';

export default class GLObject {
  constructor({
    gl,
    geometry = undefined,
    program = undefined,
  }) {
    this.gl = gl;
    this._vertexArrays = new Map();
    this._boundTextures = new Set();

    this.geometry = geometry;
    this.program = program;
  }

  get program() {
    return this._program;
  }

  set program(value) {
    this._program = value;
    const programsMap = this._vertexArrays.get(this.geometry);
    if (!programsMap.get(this._program)) {
      programsMap.set(this._program, new GLVertexArray({
        gl: this.gl,
        geometry: this.geometry,
        program: this.program,
      }));
    };
  }

  get geometry() {
    return this._geometry;
  }

  set geometry(value) {
    this._geometry = value;
    if (!this._vertexArrays.has(this.geometry)) {
      this._vertexArrays.set(this.geometry, new Map());
    }
  }

  get vertexArray() {
    return this._vertexArrays.get(this.geometry).get(this.program);
  }

  bind() {
    this.program.use();
    this.vertexArray.bind();
    for (const [name, type] of this.program.uniformTypes) {
      if (type.startsWith('sampler')) {
        const value = this.program.uniforms.get(name);
        if (value instanceof GLTexture) {
          value.bind({
            unit: this.program.textureUnits.get(name),
          });
          this._boundTextures.add(value);
        }
      }
    }
  }

  draw(options = {}) {
    options = Object.assign({ bind: false, uniforms: {} }, options);
    // Todo: Fix double call to Program.use when bind is true
    // (needed to update texture uniforms before binding them)
    this.program.use();
    for (const [key, value] of Object.entries(options.uniforms)) {
      this.program.uniforms.set(key, value);
    }
    if (options.bind) {
      this.bind();
    }
    this.geometry.draw(options);
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
