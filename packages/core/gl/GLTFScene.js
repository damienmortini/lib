import Matrix4 from '../math/Matrix4.js';

export default class GLTFScene {
  constructor({
    data,
  }) {
    this.nodes = data.nodes;

    this._flattenedNodes = new Set();

    this._nodeFinalTransformMap = new Map();
    this._nodePathMap = new Map();

    const traverse = (children) => {
      for (const child of children) {
        this._flattenedNodes.add(child);
        if (child.children) {
          traverse(child.children);
        }
      }
    };

    traverse(this.nodes);

    for (const node of this._flattenedNodes) {
      this._nodeFinalTransformMap.set(node, new Matrix4());
    }
  }

  _traverseAndUpdateTransforms(node) {
    for (const child of node.children) {
      const parentTransform = this._nodeFinalTransformMap.get(node);
      const childTransform = this._nodeFinalTransformMap.get(child);
      childTransform.multiply(parentTransform, childTransform);
      this._traverseAndUpdateTransforms(child);
    }
  }

  draw({ uniforms = {}, animations = [] } = {}) {
    for (const node of this._flattenedNodes) {
      let animationTransform = null;
      for (const animation of animations) {
        animationTransform = animation.nodeTransformMap.get(node) || animationTransform;
      }
      this._nodeFinalTransformMap.get(node).copy(animationTransform || node.transform);
    }
    for (const node of this.nodes) {
      this._traverseAndUpdateTransforms(node);
    }
    for (const node of this._flattenedNodes) {
      if (node.object) {
        node.object.draw({
          bind: true,
          uniforms: {
            ...uniforms,
            transform: this._nodeFinalTransformMap.get(node),
          },
        });
      }
    }
  }
}
