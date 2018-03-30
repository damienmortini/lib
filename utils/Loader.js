let baseURI = "";

const PROMISES = new Map();
const OBJECTS = new Map();

const TYPE_MAP = new Map([
  ["text", new Set(["txt", "html", "js", "svg"])],
  ["json", new Set(["json"])],
  ["binary", new Set(["bin"])],
  ["image", new Set(["png", "jpg", "gif"])],
  ["video", new Set(["mp4", "webm"])],
  ["audio", new Set(["mp3", "ogg"])],
  ["style", new Set(["css"])],
  ["font", new Set(["woff", "woff2", "ttf"])],
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

      let type;
      if(typeof value === "object") {
        type = value.type;
        value = value.value;
      }

      const src = `${baseURI}${typeof value === "string" ? value : (value.href || value.src)}`;
      const extension = /.*\.(.*)$/.exec(src)[1];

      if(!type) {
        for (const [key, value] of TYPE_MAP) {
          if(value.has(extension)) {
            type = key;
            break;
          }
        }
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

        fetch(`${baseURI}${src}`)
        .catch(() => {
          return new Promise(function(resolve, reject) {
            const xhr = new XMLHttpRequest
            xhr.onload = function() {
              resolve(new Response(xhr.responseText, {status: xhr.status}))
            }
            xhr.open("GET", `${baseURI}${src}`)
            xhr.send(null)
          })
        })
        .then((response) => {
          if(type === "text") {
            return response.text();
          } else if(type === "json") {
            return response.json();
          } else if(type === "binary") {
            return response.arrayBuffer();
          } else if(type === "image") {
            return new Promise((resolve) => {
              const image = document.createElement("img");
              image.onload = () => { resolve(image); }
              image.src = src;
            });
          } else if(type === "video" || type === "audio") {
            return new Promise((resolve) => {
              const media = document.createElement(type);
              media.oncanplaythrough = () => { resolve(media); }
              media.src = src;
            });
          } else if(type === "style") {
            return new Promise((resolve) => {
              const link = document.createElement("link");
              link.rel = "stylesheet";
              link.type = "text/css";
              link.onload = () => { resolve(link); }
              document.head.appendChild(link);
              link.href = src;
            });
          } else if(type === "font") {
            return new Promise((resolve) => {
              let fontFace = new FontFace(/([^\/]*)\.(woff|woff2|ttf)$/.exec(value)[1], `url("${value}")`);
              document.fonts.add(fontFace);
              return fontFace.load();
            });
          } else if(type === "template") {
            return response.text().then((html) => {
              const template = document.createElement("template");
              template.innerHTML = html;
              return template;
            });
          } else {
            return response.blob();
          }
        })
        .then((response) => {
          PROMISES.delete(value);
          OBJECTS.set(value, response);
          resolve(response);
        });
      });

      promises.push(promise);
      PROMISES.set(value, promise);
    }

    return returnArray ? Promise.all(promises) : promises[0];
  }
}
