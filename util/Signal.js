export default class Signal extends Set {
  constructor() {
    super();

    this._onceCallbacksMap = new Map();
  }

  add(value, { once = false } = {}) {
    if (once) {
      const onceCallbackWrapper = (...args) => {
        value(...args);
        this.delete(value);
      };
      this._onceCallbacksMap.set(value, onceCallbackWrapper);
      return super.add(onceCallbackWrapper);
    } else {
      return super.add(value);
    }
  }

  delete(value) {
    this._onceCallbacksMap.delete(value);
    return super.delete(this._onceCallbacksMap.get(value) || value);
  }

  dispatch(value) {
    for (const callback of this) {
      callback(value);
    }
  }
}
