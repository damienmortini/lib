import Matrix4 from '../math/Matrix4.js';

export default class GLTFScene {
  constructor({
    data,
  }) {
    this.nodes = data.nodes;

    this._flattenedNodes = new Set();

    this._nodeWorldTransformMap = new Map();

    const traverse = (children) => {
      for (const child of children) {
        this._flattenedNodes.add(child);
        if (child.children) {
          traverse(child.children);
        }
      }
    };

    traverse(this.nodes);

    this._skins = new Set();
    for (const node of this._flattenedNodes) {
      if (node.skin !== undefined) {
        this._skins.add(node.skin);
      }
      this._nodeWorldTransformMap.set(node, new Matrix4());
    }
  }

  _traverseAndUpdateTransforms(node) {
    const parentWorldTransform = this._nodeWorldTransformMap.get(node);
    for (const child of node.children) {
      const childWorldTransform = this._nodeWorldTransformMap.get(child);
      if (child.skin?.name !== node.name) { // fix for skin matrix applied twice, might need more fine tuning
        childWorldTransform.multiply(parentWorldTransform, childWorldTransform);
      }
      this._traverseAndUpdateTransforms(child);
    }
  }

  updateAndDraw({ uniforms = {}, animations = [] } = {}) {
    this.update({ animations });
    this.draw({ uniforms });
  }

  update({ animations = [] } = {}) {
    for (const node of this._flattenedNodes) {
      this._nodeWorldTransformMap.get(node).copy(node.matrix);
    }
    for (const node of this.nodes) {
      this._traverseAndUpdateTransforms(node);
    }
    for (const skin of this._skins) {
      for (let index = 0; index < skin.joints.length; index++) {
        const joint = skin.joints[index];
        skin.updateJointMatrix(index, this._nodeWorldTransformMap.get(joint));
      }
      skin.updateJointsTexture();
    }
    for (const node of this._flattenedNodes) {
      node.updateSkin();
    }
  }

  draw({ uniforms = {} } = {}) {
    for (const node of this._flattenedNodes) {
      node.draw({
        bind: true,
        uniforms: {
          transform: this._nodeWorldTransformMap.get(node),
          ...(node.weights ? { morphTargetWeights: node.weights } : null),
          ...uniforms,
        },
      });
    }
  }
}
