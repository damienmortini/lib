export default class GLVertexArray {
  constructor({
    gl = undefined,
    mesh = undefined,
    program = undefined
  } = {}) {
    this.gl = gl;
    this.program = program;
    this.mesh = mesh;

    const extension = gl.getExtension("OES_vertex_array_object");
    if(extension) {
      this.gl.createVertexArray = extension.createVertexArrayOES.bind(extension);
      this.gl.bindVertexArray = extension.bindVertexArrayOES.bind(extension);
    }

    this._vertexArray = this.gl.createVertexArray();
    this.bind();
    this.program.attributes.set(this.mesh.attributes);
    this.mesh.indices.buffer.bind();
    this.unbind();
  }

  bind() {
    this.gl.bindVertexArray(this._vertexArray);
  }

  unbind() {
    this.gl.bindVertexArray(null);
  }
}