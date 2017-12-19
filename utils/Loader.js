let baseURI = "";

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

  static get baseURI() {
    return baseURI;
  }

  static set baseURI(value) {
    baseURI = value;
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

      let promise = new Promise(function(resolve, reject) {
        if(PROMISES.get(value)) {
          PROMISES.get(value).then(resolve);
          return;
        }
        
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
          } else if(/\.(mp4|webm)$/.test(value)) {
            element = document.createElement("video");
          } else if(/\.(mp3|ogg)$/.test(value)) {
            element = document.createElement("audio");
          } else if(/\.(woff|woff2|ttf)$/.test(value)) {
            let fontFace = new FontFace(/([^\/]*)\.(woff|woff2|ttf)$/.exec(value)[1], `url("${value}")`);
            fontFace.load().then(onLoad);
            document.fonts.add(fontFace);
          } else {
            fetch(`${baseURI}${value}`)
            .catch(() => {
              return new Promise(function(resolve, reject) {
                const xhr = new XMLHttpRequest
                xhr.onload = function() {
                  resolve(new Response(xhr.responseText, {status: xhr.status}))
                }
                xhr.open("GET", `${baseURI}${value}`)
                xhr.send(null)
              })
            })
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
          const src = `${baseURI}${element.src || value}`;
          const loaded = () => {
            element.removeEventListener("canplaythrough", loaded);
            element.removeEventListener("load", loaded);
            onLoad(element);
          }
          if(element.play) {
            fetch(src)
            .then(() => {
              element.addEventListener("canplaythrough", loaded);
              element.play();
              // TODO: Check if this is still needed
              if(!element.autoplay) {
                let pauseElement = function() {
                  element.pause();
                  element.removeEventListener("playing", pauseElement);
                }
                element.addEventListener("playing", pauseElement);
              }
            });
          } else {
            element.addEventListener("load", loaded);
          }
          element.src = src;
        }
      });

      promises.push(promise);
      PROMISES.set(value, promise);
    }

    return returnArray ? Promise.all(promises) : promises[0];
  }
}
