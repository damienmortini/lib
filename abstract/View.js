export default class View {
  constructor({
    visible = true,
    visibilityExecutor = (resolve, view) => resolve()
  } = {}) {
    this.visibilityExecutor = visibilityExecutor;

    this.visibilityPromise = null;

    this.parent = null;
    this.children = new Set();

    this.visible = visible;
  }

  set visible(value) {
    this._selfVisible = value;

    if (value === this._visible) {
      return;
    }

    this._visible = this.parent ? this.parent.visible && value : value;

    let promises = [];

    for (let child of this.children) {
      let childSelfVisible = child._selfVisible;
      child.visible = this._visible && child._selfVisible;
      child._selfVisible = childSelfVisible;
      promises.push(child.visibilityPromise);
    }

    promises.push(new Promise((resolve) => {
      this.visibilityExecutor(resolve, this);
    }));

    this.visibilityPromise = Promise.all(promises);
  }

  get visible() {
    return this._visible;
  }

  add(view) {
    if (view.parent) {
      view.parent.remove(view);
    }
    view.parent = this;
    this.children.add(view);
    view.visible = this.visible && view._selfVisible;
  }

  remove(view) {
    view.parent = null;
    this.children.delete(view);
  }
}
