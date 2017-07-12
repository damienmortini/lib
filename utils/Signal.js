export default class Signal extends Set {
  constructor() {
    super();
    
    this._onceCallbacks = new Set();
  }

  add(value, {once = false} = {}) {
    if(once) {
      this._onceCallbacks.add(value);
    }

    super.add(value);
  }

  dispatch(value) {
    for (let callback of this) {
      callback(value);

      if(this._onceCallbacks.has(callback)) {
        this._onceCallbacks.delete(callback);
        this.delete(callback);
      }
    }
  }
}
