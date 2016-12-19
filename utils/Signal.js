export default class Signal extends Set {
  constructor() {
    super();
  }

  dispatch(value) {
    for (let callback of this) {
      callback(value);
    }
  }
}
