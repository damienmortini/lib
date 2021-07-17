export default class GUIServer {
  static add(options) {
    window.dispatchEvent(new CustomEvent('damoguiadd', {
      detail: {
        options,
      },
    }))
  }
}
