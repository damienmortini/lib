import Matrix4 from '../math/Matrix4.js';
import Quaternion from '../math/Quaternion.js';
import BasicShader from '../shader/BasicShader.js';
import GLObject from './GLObject.js';
import GLProgram from './GLProgram.js';

const QUATERNION = new Quaternion();
const MATRIX4 = new Matrix4();

export default class GLTFNode {
  constructor({
    gl,
    data,
  }) {
    this.name = data.name;
    this.transform = new Matrix4();
    this.children = data.children || [];

    if (data.translation) {
      this.transform.translate(data.translation);
    }

    if (data.rotation) {
      QUATERNION.copy(data.rotation);
      MATRIX4.fromQuaternion(QUATERNION);
      this.transform.multiply(MATRIX4);
    }

    if (data.scale) {
      this.transform.scale(data.scale);
    }

    if (data.mesh) {
      this.object = new GLObject({
        gl,
        mesh: data.mesh,
        program: new GLProgram({
          gl,
          shader: new BasicShader({
            normals: true,
            uniforms: {
              transform: this.transform,
            },
            fragmentChunks: [
              ['end', `
                fragColor = vec4(vNormal * .5 + .5, 1.);
              `],
            ],
          }),
        }),
      });
    }
  }
}
