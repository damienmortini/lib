import Matrix4 from '../math/Matrix4.js';

export default class GLTFScene {
  constructor({
    data,
  }) {
    this.nodes = data.nodes;

    this._flattenedNodes = new Set();

    this._nodeWorldTransformMap = new Map();
    this._nodeParentWorldTransformMap = new Map();

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
    for (const child of node.children) {
      const parentWorldTransform = this._nodeWorldTransformMap.get(node);
      const childWorldTransform = this._nodeWorldTransformMap.get(child);
      childWorldTransform.multiply(parentWorldTransform, childWorldTransform);
      this._nodeParentWorldTransformMap.set(child, parentWorldTransform);
      this._traverseAndUpdateTransforms(child);
    }
  }

  updateAndDraw({ uniforms = {}, animations = [] } = {}) {
    this.update({ animations });
    this.draw({ uniforms });
  }

  update({ animations = [] } = {}) {
    for (const node of this._flattenedNodes) {
      let animationTransform = null;
      for (const animation of animations) {
        animationTransform = animation.nodeTransformMap.get(node) || animationTransform;
      }
      this._nodeWorldTransformMap.get(node).copy(animationTransform || node.transform);
    }
    for (const node of this.nodes) {
      this._traverseAndUpdateTransforms(node);
    }
    for (const skin of this._skins) {
      for (let index = 0; index < skin.joints.length; index++) {
        const joint = skin.joints[index];
        skin.updateJointMatrix(index, this._nodeWorldTransformMap.get(joint), this._nodeParentWorldTransformMap.get(joint));
      }
    }
    for (const node of this.nodes) {
      node.updateSkin();
    }
  }

  draw({ uniforms = {} } = {}) {
    for (const node of this._flattenedNodes) {
      node.draw({
        bind: true,
        uniforms: {
          ...uniforms,
          transform: this._nodeWorldTransformMap.get(node),
        },
      });
    }
  }
}
