export default class Signal extends Set {
  constructor() {
    super();

    this._onceCallbacksMap = new Map();
  }

  add(value, {once = false} = {}) {
    if(once) {
      const onceCallbackWrapper = () => {
        value(...arguments);
        this.delete(value);
      };
      this._onceCallbacksMap.set(value, onceCallbackWrapper);
      super.add(onceCallbackWrapper);
    } else {
      super.add(value);
    }
  }

  delete(value) {
    super.delete(this._onceCallbacksMap.get(value) || value);
    this._onceCallbacksMap.delete(value);
  }

  dispatch(value) {
    for (let callback of this) {
      callback(value);
    }
  }
}
