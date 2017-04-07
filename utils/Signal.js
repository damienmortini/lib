export default class Signal extends Set {
  dispatch(value) {
    for (let callback of this) {
      callback(value);
    }
  }
}
