export class Signal extends Set {
  dispatch(value) {
    for (const callback of this) {
      callback(value)
    }
  }
}
