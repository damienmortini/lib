import "whatwg-fetch";

const PROMISES = new Map();
const OBJECTS = new Map();

export default class Loader {
  static get onLoad() {
    return Promise.all(PROMISES.values());
  }

  static get promises() {
    return PROMISES;
  }

  static get(value) {
    return OBJECTS.get(value);
  }

  static load(values) {
    if(!(values instanceof Array)) {
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

        let element = value instanceof HTMLElement ? value : null;

        let onLoad = (response) => {
          PROMISES.delete(value);
          OBJECTS.set(value, response);
          if(element) {
            element.removeEventListener("load", onLoad);
            element.removeEventListener("canplaythrough", onLoad);
            resolve(element);
          } else {
            resolve(response);
          }
        };

        if(typeof value === "string") {
          let tagName;
          if(/\.(png|jpg|gif)$/.test(value)) {
            tagName = "img";
          } else if(/\.(mp4|webm)$/.test(value)) {
            tagName = "video";
          } else if(/\.(mp3|ogg)$/.test(value)) {
            tagName = "audio";
          } else if(/\.(woff|woff2)$/.test(value)) {
            let fontFace = new FontFace(/([^\/]*)\.(woff|woff2)$/.exec(value)[1], `url(${value})`);
            fontFace.load().then(onLoad);
            document.fonts.add(fontFace);
          } else {
            fetch(value)
            .catch((err) => {
              return new Promise(function(resolve, reject) {
                let xhr = new XMLHttpRequest();
                xhr.onload = () => {
                  resolve(new Response(xhr.responseText, {status: xhr.status}));
                }
                xhr.open("GET", value);
                xhr.send(null);
              });
            })
            .then((response) => {
              return response[/\.(json)$/.test(value) ? "json" : "text"]();
            })
            .then(onLoad);
          }
          if(tagName) {
            element = document.createElement(tagName);
          }
        }

        if(element) {
          if(element instanceof HTMLMediaElement) {
            element.addEventListener("canplaythrough", onLoad);
          } else {
            element.addEventListener("load", onLoad);
          }

          element.src = element.src || value;

          if(element instanceof HTMLMediaElement) {
            element.play();
            if(!element.autoplay) {
              element.pause();
            }
          }
        }
      });

      promises.push(promise);
      PROMISES.set(value, promise);
    }

    return promises.length > 1 ? Promise.all(promises) : promises[0];
  }
}
