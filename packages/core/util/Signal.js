console.warn('Deprecated. Use @damienmortini/signal instead.');

export default class Signal extends Set {
  dispatch(value) {
    for (const callback of this) {
      callback(value);
    }
  }
}
