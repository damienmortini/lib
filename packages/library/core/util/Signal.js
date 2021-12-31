export default class Signal extends Set {
  dispatch(value) {
    console.log(this)
    for (const callback of this) {
      callback(value)
    }
  }
}
