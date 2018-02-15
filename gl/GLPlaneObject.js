import PlaneMesh from "../3d/PlaneMesh.js";
import GLObject from "./GLObject.js";
import GLMesh from "./GLMesh.js";
import GLVertexAttribute from "./GLVertexAttribute.js";
import GLProgram from "./GLProgram.js";
import Matrix4 from "../math/Matrix4.js";
import BasicShader from "../shaders/BasicShader.js";

export default class GLPlaneObject extends GLObject {
  constructor({
    gl,
    width = 1,
    height = 1,
    columns = 1,
    rows = 1,
    positions = undefined,
    normals = undefined,
    uvs = undefined,
    indices = undefined,
    transform = new Matrix4(),
    shaders = []
  } = { gl }) {
    super({
      gl,
      mesh: new GLMesh(Object.assign({ gl }, new PlaneMesh({
        width,
        height,
        columns,
        rows,
        positions,
        normals,
        uvs,
        indices
      }))),
      program: new GLProgram({
        gl,
        shaders: [
          new BasicShader({
            normal: false,
            uv: false
          }),
          ...shaders
        ]
      })
    });

    this.transform = transform;
  }

  draw({ camera = undefined } = {}) {
    this.program.use();
    if (this.transform) {
      this.program.uniforms.set("transform", this.transform);
    }
    if (camera) {
      this.program.uniforms.set("projectionView", camera.projectionView);
    }
    this.vertexArray.bind();
    this.mesh.draw();
    this.vertexArray.unbind();
  }
}