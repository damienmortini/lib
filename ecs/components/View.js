import Component from "../Component.js";

console.error("Deprecated: needs refactor using dlib/abstract/View.js");

export default class View extends Component {
  constructor(entity, view, {
    visible = true,
    visibilityExecutor = (resolve) => resolve()
  } = {}) {
    super(entity);

    this.visibilityExecutor = visibilityExecutor;

    this._view = view;

    this.visibilityPromise = null;

    this._parent = null;
    this._children = new Set();

    this.visible = visible;
    this._view.visible = visible;
  }

  set visible(value) {
    this._selfVisible = value;

    if(value === this._visible) {
      return;
    }

    this._visible = this._parent ? this._parent.visible && value : value;

    if(this._visible) {
      this._view.visible = true;
    }

    let promises = [];

    for (let child of this._children) {
      let childSelfVisible = child._selfVisible;
      child.visible = this._visible && child._selfVisible;
      child._selfVisible = childSelfVisible;
      promises.push(child.visibilityPromise);
    }

    promises.push(new Promise((resolve) => {
      this.visibilityExecutor(resolve, this);
    }));

    this.visibilityPromise = Promise.all(promises).then(() => {
      this._view.visible = this._visible;
      this.visibilityPromise = null;
    });
  }

  get visible() {
    return this._visible;
  }

  get view() {
    return this._view;
  }

  add(view) {
    if(view._parent) {
      view._parent.remove(view);
    }
    view._parent = this;
    this._children.add(view);
    view.visible = this.visible && view._selfVisible;
    this._view.add(view._view);
  }

  remove(view) {
    view._parent = null;
    this._children.delete(view);
    this._view.remove(view._view);
  }
}
