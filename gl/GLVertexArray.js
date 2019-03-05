export default class GLVertexArray {
  constructor({
    gl,
    mesh = undefined,
    program = undefined,
  } = { gl }) {
    this.gl = gl;

    const extension = gl.getExtension("OES_vertex_array_object");
    if (extension) {
      this.gl.createVertexArray = extension.createVertexArrayOES.bind(extension);
      this.gl.bindVertexArray = extension.bindVertexArrayOES.bind(extension);
    }

    this._vertexArray = this.gl.createVertexArray();

    if (mesh && program) {
      this.add({
        mesh,
        program,
      });
    }
  }

  add({
    mesh = undefined,
    program = undefined,
  } = {}) {
    this.bind();
    program.attributes.set(mesh.attributes);
    if (mesh.indices) {
      mesh.indices.buffer.bind();
    }
    this.unbind();
  }

  bind() {
    this.gl.bindVertexArray(this._vertexArray);
  }

  unbind() {
    this.gl.bindVertexArray(null);
  }
}
