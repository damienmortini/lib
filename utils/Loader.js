const PROMISES = new Set();

export default class Loader {
  static get onLoad() {
    return Promise.all(PROMISES);
  }

  static get promises() {
    return PROMISES;
  }

  static load(values) {
    if(!(values instanceof Array)) {
      values = [values];
    }

    let promises = [];

    for (let value of values) {
      promises.push(new Promise(function(resolve, reject) {
        let onLoad = () => {
          PROMISES.delete(promise);
          value.removeEventListener("load", onLoad);
          value.removeEventListener("canplaythrough", onLoad);
          resolve(value);
        };

        if(typeof value === "string") {
          let tagName;
          if(/\.(png|jpg|gif)$/.test(value)) {
            tagName = "img";
          } else if(/\.(mp4|webm)$/.test(value)) {
            tagName = "video";
          } else if(/\.(mp3|ogg)$/.test(value)) {
            tagName = "audio";
          }
          if(tag) {
            let element = document.createElement(tagName);
            element.src = value;
            value = element;
          }
        }

        if(value instanceof HTMLMediaElement) {
          if(value instanceof HTMLMediaElement) {
            value.addEventListener("canplaythrough", onLoad);
          } else {
            value.addEventListener("load", onLoad);
          };
        } else {
          // TODO: fetch
        }
      }));
    }

    PROMISES.add(promises);

    return Promise.all(promises);
  }
}
