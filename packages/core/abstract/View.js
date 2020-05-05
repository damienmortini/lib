const SELF_HIDDEN = 1;
const HIDDEN_BY_PARENT = 2;

export default class View {
  constructor({
    hidden = false,
  } = {}) {
    this._hiddenFlag = hidden ? SELF_HIDDEN : 0;

    this.parent = null;
    this.children = new Set();

    this._currentVisibilityPromise = null;
  }

  async _updateVisibility(hiddenFlag) {
    if (!!hiddenFlag === !!this._hiddenFlag) {
      this._hiddenFlag = hiddenFlag;
      return this._currentVisibilityPromise || Promise.resolve();
    }

    this._hiddenFlag = hiddenFlag;

    const promises = [];

    for (const child of this.children) {
      let childPromise;
      if (this.isHidden) {
        childPromise = child._updateVisibility(child._hiddenFlag | HIDDEN_BY_PARENT);
      } else {
        childPromise = child._updateVisibility(child._hiddenFlag & ~HIDDEN_BY_PARENT);
      }
      promises.push(childPromise);
    }

    promises.push((async () => {
      if (this.isHidden) {
        return this.onHide();
      } else {
        return this.onShow();
      }
    })());

    const promise = this._currentVisibilityPromise = Promise.all(promises).then(() => {
      if (promise !== this._currentVisibilityPromise) {
        return new Promise(() => { });
      }
    });

    return this._currentVisibilityPromise;
  }

  async show() {
    return this._updateVisibility(this._hiddenFlag & ~SELF_HIDDEN);
  }

  async hide() {
    return this._updateVisibility(this._hiddenFlag | SELF_HIDDEN);
  }

  get hidden() {
    return !!(this._hiddenFlag & SELF_HIDDEN);
  }

  set hidden(value) {
    if (value) {
      this.hide();
    } else {
      this.show();
    }
  }

  get isHidden() {
    return !!this._hiddenFlag;
  }

  async onShow() { }

  async onHide() { }

  add(view) {
    if (this.children.has(view)) {
      return;
    }
    if (view.parent) {
      view.parent.remove(view);
    }
    view.parent = this;
    this.children.add(view);
    if (this.isHidden) {
      view._updateVisibility(view._hiddenFlag | HIDDEN_BY_PARENT);
    }
  }

  remove(view) {
    if (!this.children.has(view)) {
      return;
    }
    view.parent = null;
    this.children.delete(view);
    view._updateVisibility(view._hiddenFlag & ~HIDDEN_BY_PARENT);
  }
}
