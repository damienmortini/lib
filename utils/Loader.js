export default class Loader {
  static load(elements) {
    if(!(elements instanceof Array)) {
      elements = [elements];
    }

    let promises = [];

    for (let element of elements) {
      promises.push(new Promise(function(resolve, reject) {
        let onLoad = () => {
          element.removeEventListener("load", onLoad);
          resolve(element);
        };
        if(element instanceof HTMLMediaElement) {
          element.addEventListener("canplaythrough", onLoad);
        } else {
          element.addEventListener("load", onLoad);
        };
      }));
    }

    return Promise.all(promises);
  }
}
