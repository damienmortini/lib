export class Signal<T = void> extends Set<(value?: T) => void> {
  dispatch(value?: T) {
    for (const callback of this) {
      callback(value);
    }
  }

  add(callback: (value?: T) => void, options?: { once?: boolean }): this {
    if (!options?.once) {
      return super.add(callback);
    }
    const onceCallback = (value?: T) => {
      callback(value);
      this.delete(onceCallback);
    };
    return super.add(onceCallback);
  }
}
