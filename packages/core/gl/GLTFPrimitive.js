import GLBuffer from './GLBuffer.js';
import GLMesh from './GLMesh.js';
import GLObject from './GLObject.js';
import GLTFMaterial from './GLTFMaterial.js';
import GLVertexAttribute from './GLVertexAttribute.js';

const ATTRIBUTE_NAME_MAP = new Map([
  ['POSITION', 'position'],
  ['NORMAL', 'normal'],
  ['TEXCOORD_0', 'uv'],
  ['WEIGHTS_0', 'weight'],
  ['JOINTS_0', 'joint'],
]);

export default class GLTFPrimitive {
  constructor({
    gl,
    data,
  }) {
    this.material = new GLTFMaterial({ gl, skin: !!data.attributes['JOINTS_0'], morphTargetsNumber: data.targets?.length });
    // this.material = data.material ?? new GLTFMaterial({ gl, skin: !!data.attributes['JOINTS_0'], morphTargets: !!data.targets });
    this.attributes = data.attributes;
    this.indices = data.indices;
    this.computedAttributes = new Map();
    this.computedIndices = null;

    const targetAttributes = new Map();
    if (data.targets) {
      for (let index = 0; index < data.targets.length; index++) {
        const target = data.targets[index];
        if (target.POSITION) targetAttributes.set(`morphTargetPosition${index}`, target.POSITION);
        if (target.NORMAL) targetAttributes.set(`morphTargetNormal${index}`, target.NORMAL);
        if (target.TANGENT) targetAttributes.set(`morphTargetTangent${index}`, target.TANGENT);
      }
    }

    for (const [attributeName, attribute] of [...Object.entries(data.attributes), ...targetAttributes]) {
      this.computedAttributes.set(ATTRIBUTE_NAME_MAP.get(attributeName) ?? attributeName, attribute);
    }

    const vertexAttributes = new Map();
    for (const [attributeName, attribute] of this.computedAttributes) {
      vertexAttributes.set(attributeName, new GLVertexAttribute({
        gl,
        ...attribute,
        buffer: new GLBuffer({
          gl,
          data: attribute.buffer,
        }),
      }));
    }

    if (data.indices) {
      this.computedIndices = new GLVertexAttribute({
        gl,
        ...data.indices,
        buffer: new GLBuffer({
          gl,
          data: data.indices.buffer,
          target: gl.ELEMENT_ARRAY_BUFFER,
        }),
      });
    }

    this._mesh = new GLMesh({
      gl,
      attributes: vertexAttributes,
      indices: this.computedIndices,
    });

    this._object = new GLObject({
      gl,
      mesh: this._mesh,
      program: this.material.program,
    });
  }
}
