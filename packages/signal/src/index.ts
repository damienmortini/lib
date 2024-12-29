export class Signal<T> extends Set<(value: T) => void> {
  dispatch(value: T) {
    for (const callback of this) {
      callback(value);
    }
  }
}
