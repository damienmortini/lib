export class Loader {
  constructor() {
    this.typeMap = new Map([
      ["text", new Set(["txt", "html", "js", "svg"])],
      ["json", new Set(["json"])],
      ["binary", new Set(["bin"])],
      ["image", new Set(["png", "jpg", "gif"])],
      ["video", new Set(["mp4", "webm"])],
      ["audio", new Set(["mp3", "ogg"])],
      ["style", new Set(["css"])],
      ["font", new Set(["woff", "woff2", "ttf"])],
    ]);

    this.baseURI = "";

    this._promises = new Map();
    this._objects = new Map();
  }

  get onLoad() {
    return Promise.all(this._promises.values());
  }

  get(value) {
    return this._objects.get(value);
  }

  has(value) {
    return this._objects.has(value);
  }

  load(values) {
    const isArray = values instanceof Array;

    if (!isArray) {
      values = [values];
    }

    const promises = [];

    for (const value of values) {
      if (!value) {
        continue;
      }

      const key = typeof value === "string" ? value : JSON.stringify(value);

      let options;
      let src = value;
      let baseURI = this.baseURI;

      if (typeof value === "object") {
        src = value.src;
        baseURI = value.baseURI !== undefined ? value.baseURI : baseURI;
        options = value;
      }

      src = `${baseURI}${src}`;

      const promise = new Promise((resolve, reject) => {
        if (this._promises.get(key)) {
          resolve(this._promises.get(key));
          return;
        }

        if (this.get(key)) {
          resolve(this.get(key));
          return;
        }

        this._loadFile(src, options).then((response) => {
          this._promises.delete(key);
          this._objects.set(key, response);
          resolve(response);
        });
      });

      this._promises.set(key, promise);
      promises.push(promise);
    }

    return isArray ? Promise.all(promises) : promises[0];
  }

  _loadFile(src, options = {}) {
    let type = options.type;

    const extension = /.*\.(.*)$/.exec(src)[1];

    if (!type) {
      for (const [key, value] of this.typeMap) {
        if (value.has(extension)) {
          type = key;
          break;
        }
      }
    }

    return new Promise((resolve) => {
      if (type === "image") {
        const image = document.createElement("img");
        image.onload = () => {
          resolve(image);
        };
        image.src = src;
      } else {
        resolve(fetch(src));
      }
    })
        .catch(() => {
          return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest;
            xhr.onload = () => {
              resolve(new Response(xhr.responseText, { status: xhr.status }));
            };
            xhr.open("GET", `${this.baseURI}${src}`);
            xhr.send(null);
          });
        })
        .then((response) => {
          if (type === "text") {
            return response.text();
          } else if (type === "json") {
            return response.json();
          } else if (type === "binary") {
            return response.arrayBuffer();
          } else if (type === "image") {
            return response;
          } else if (type === "video" || type === "audio") {
            return new Promise((resolve) => {
              const media = document.createElement(type);
              media.oncanplaythrough = () => {
                resolve(media);
              };
              media.src = src;
            });
          } else if (type === "style") {
            return new Promise((resolve) => {
              const link = document.createElement("link");
              link.rel = "stylesheet";
              link.type = "text/css";
              const onLoad = () => {
                link.removeEventListener("load", onLoad);
                resolve(link);
              };
              link.addEventListener("load", onLoad);
              link.href = src;
              document.head.appendChild(link);
            });
          } else if (type === "font") {
            return new Promise((resolve) => {
              const fontFace = new FontFace(/([^\/]*)\.(woff|woff2|ttf)$/.exec(src)[1], `url("${src}")`);
              document.fonts.add(fontFace);
              return fontFace.load();
            });
          } else if (type === "template") {
            return response.text().then((html) => {
              const template = document.createElement("template");
              template.innerHTML = html;
              return template;
            });
          } else {
            return response.blob();
          }
        });
  }
}

export default new Loader();
