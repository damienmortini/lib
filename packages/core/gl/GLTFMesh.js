import GLBuffer from './GLBuffer.js';
import GLMesh from './GLMesh.js';
import GLVertexAttribute from './GLVertexAttribute.js';

const ATTRIBUTE_NAME_MAP = new Map([
  ['POSITION', 'position'],
  ['NORMAL', 'normal'],
  ['TEXCOORD_0', 'uv'],
  ['WEIGHTS_0', 'weight'],
  ['JOINTS_0', 'joint'],
]);

const ATTRIBUTE_TYPE_SIZE_MAP = new Map([
  ['SCALAR', 1],
  ['VEC2', 2],
  ['VEC3', 3],
  ['VEC4', 4],
  ['MAT2', 4],
  ['MAT3', 9],
  ['MAT4', 16],
]);

export default class GLTFMesh extends GLMesh {
  constructor({
    gl,
    data,
  }) {
    super({
      gl,
    });

    for (const [attributeName, attribute] of Object.entries(data.primitives[0].attributes)) {
      this.attributes.set(ATTRIBUTE_NAME_MAP.get(attributeName), {
        buffer: new GLBuffer({
          gl: this.gl,
          data: attribute.bufferView.buffer,
        }),
        size: ATTRIBUTE_TYPE_SIZE_MAP.get(attribute.type),
        count: attribute.count,
        offset: attribute.bufferView.byteOffset,
        target: attribute.bufferView.target,
      });
    }
    const indices = data.primitives[0].indices;

    if (indices) {
      this.indices = new GLVertexAttribute({
        gl: this.gl,
        buffer: new GLBuffer({
          gl: this.gl,
          data: indices.bufferView.buffer,
          target: this.gl.ELEMENT_ARRAY_BUFFER,
        }),
        type: indices.componentType,
        offset: indices.bufferView.byteOffset,
        count: indices.count,
      });
    }
  }
}
