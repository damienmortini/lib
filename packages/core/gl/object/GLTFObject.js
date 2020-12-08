import GLObject from '../GLObject.js';
import GLTFMesh from '../GLTFMesh.js';
import GLProgram from '../GLProgram.js';

export default class GLTFObject extends GLObject {
  constructor({
    gl,
    gltfData,
  }) {
    super({
      gl,
    });
  }
}
