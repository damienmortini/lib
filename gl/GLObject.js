import Matrix4 from "../math/Matrix4.js";
import GLMesh from "./GLMesh.js";
import GLProgram from "./GLProgram.js";
import GLVertexArray from "./GLVertexArray.js";

export default class GLObject {
  constructor({
    gl,
    transform = new Matrix4(),
    mesh = new GLMesh(),
    program = new GLProgram(),
    vertexArray = new GLVertexArray({
      gl, 
      mesh,
      program
    })
  } = { gl }) {
    this.gl = gl;
    this.transform = transform;
    this.mesh = mesh;
    this.program = program;
    this.vertexArray = vertexArray;
  }

  draw() {
    this.program.use();
    this.vertexArray.bind();
    this.mesh.draw();
    this.vertexArray.unbind();
  }
}