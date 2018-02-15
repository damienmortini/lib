import PlaneMesh from "../3d/PlaneMesh.js";
import GLObject from "./GLObject.js";
import GLMesh from "./GLMesh.js";
import GLVertexAttribute from "./GLVertexAttribute.js";
import GLProgram from "./GLProgram.js";
import Matrix4 from "../math/Matrix4.js";

export default class GLPlane extends GLObject {
  constructor({
    gl,
    width = 1,
    height = 1,
    columns = 1,
    rows = 1,
    transform = undefined,
    shaders = undefined
  } = { gl }) {
    const planeMesh = new PlaneMesh({ width, height, columns, rows });
    super({
      gl,
      transform,
      mesh: new GLMesh({
        gl,
        attributes: [
          ["position", new GLVertexAttribute({
            gl,
            data: planeMesh.positions,
            size: 3
          })],
          ["normal", new GLVertexAttribute({
            gl,
            data: planeMesh.normals,
            size: 3
          })],
          ["uv", new GLVertexAttribute({
            gl,
            data: planeMesh.uvs,
            size: 2
          })]
        ],
        indiceData: planeMesh.indices
      }),
      program: new GLProgram({
        gl,
        shaders,
        vertexShaderChunks: [
          ["start", `
            uniform mat4 projectionView;
            uniform mat4 transform;

            in vec3 position;
            in vec3 normal;
            in vec2 uv;

            out vec3 vPosition;
            out vec3 vNormal;
            out vec2 vUv;
          `],
          ["main", `
            vPosition = position;
            vNormal = normal;
            vUv = uv;
          `],
          ["end", `
            gl_Position = projectionView * transform * vec4(position, 1.);
          `]
        ],
        fragmentShaderChunks: [
          ["start", `
            in vec3 vPosition;
            in vec3 vNormal;
            in vec2 vUv;
          `],
          ["end", `
            fragColor = vec4(vUv, 0., 1.);
          `]
        ]
      })
    });
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