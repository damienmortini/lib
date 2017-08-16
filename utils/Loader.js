const PROMISES = new Map();
const OBJECTS = new Map();

const TYPE_MAP = new Map([
  ["text", new Set(["txt", "html", "css", "js", "svg"])],
  ["json", new Set(["json"])],
  ["binary", new Set(["bin"])]
]);

export default class Loader {
  static get onLoad() {
    return Promise.all(PROMISES.values());
  }

  static get promises() {
    return PROMISES;
  }

  static get typeMap() {
    return TYPE_MAP;
  }

  static get(value) {
    return OBJECTS.get(value);
  }

  static load(values) {
    const returnArray = values instanceof Array;
    
    if(!returnArray) {
      values = [values];
    }

    let promises = [];

    for (let value of values) {
      if(!value) {
        continue;
      }

      let promise = PROMISES.get(value) || new Promise(function(resolve, reject) {
        if(Loader.get(value)) {
          resolve(Loader.get(value));
          return;
        }

        let onLoad = (response) => {
          PROMISES.delete(value);
          OBJECTS.set(value, response);
          resolve(response);
        };

        let element;
        
        if(typeof value === "string") {
          let extension = /[\\/](.*)\.(.*)$/.exec(value)[2];

          if(/\.(png|jpg|gif)$/.test(value)) {
            element = document.createElement("img");
            element.src = value;
          } else if(/\.(mp4|webm)$/.test(value)) {
            element = document.createElement("video");
            element.src = value;
          } else if(/\.(mp3|ogg)$/.test(value)) {
            element = document.createElement("audio");
            element.src = value;
          } else if(/\.(woff|woff2)$/.test(value)) {
            let fontFace = new FontFace(/([^\/]*)\.(woff|woff2)$/.exec(value)[1], `url("${value}")`);
            fontFace.load().then(onLoad);
            document.fonts.add(fontFace);
          } else {
            fetch(value)
            .then((response) => {
              let method;
              if(Loader.typeMap.get("json").has(extension)) {
                method = "json";
              } else if(Loader.typeMap.get("binary").has(extension)) {
                method = "arrayBuffer";
              } else if(Loader.typeMap.get("text").has(extension)) {
                method = "text";
              } else {
                method = "blob";
              }
              return response[method]();
            })
            .then(onLoad);
          }
        }

        if(value instanceof HTMLElement) {
          element = value;
        }

        if(element) {
          fetch(element.src)
          .then((response) => {
            return response.blob();
          })
          .then(() => {
            const loaded = () => {
              element.removeEventListener("canplaythrough", loaded);
              element.removeEventListener("load", loaded);
              onLoad(element);
            }
            if(element.play) {
              element.addEventListener("canplaythrough", loaded);
              element.play();
              if(!element.autoplay) {
                let pauseElement = function() {
                  element.pause();
                  element.removeEventListener("playing", pauseElement);
                }
                element.addEventListener("playing", pauseElement);
              }
            } else {
              element.addEventListener("load", loaded);
            }
          });
        }
      });

      promises.push(promise);
      PROMISES.set(value, promise);
    }

    return returnArray ? Promise.all(promises) : promises[0];
  }
}
