let PROMISE;

export default class Google {
  static loadApi() {
    PROMISE = PROMISE || new Promise((resolve) => {
      const script = document.createElement('script');
      script.onload = resolve;
      script.src = '//apis.google.com/js/api.js';
      document.head.appendChild(script);
    });
    return PROMISE;
  }
}

export class GoogleSheets {
  static parseJSON(json) {
    const keyMap = new Map();
    const objectMap = new Map();
    for (const { gs$cell } of json.feed.entry) {
      if (gs$cell.row === '1') {
        keyMap.set(gs$cell.col, gs$cell.inputValue);
        continue;
      }
      let object = objectMap.get(gs$cell.row);
      if (!object) {
        object = {};
        objectMap.set(gs$cell.row, object);
      }
      object[keyMap.get(gs$cell.col)] = gs$cell.inputValue;
    }
    return [...objectMap.values()];
  }
}
