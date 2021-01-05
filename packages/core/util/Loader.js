export class Loader {
  constructor() {
    this.extensionTypeMap = new Map([
      ['txt', 'text/plain'],
      ['html', 'text/html'],
      ['js', 'text/javascript'],
      ['css', 'text/css'],
      ['json', 'application/json'],
      ['svg', 'image/svg+xml'],
      ['png', 'image/png'],
      ['jpg', 'image/jpeg'],
      ['gif', 'image/gif'],
      ['mp4', 'video/mp4'],
      ['webm', 'video/webm'],
      ['mp3', 'audio/mp3'],
      ['ogg', 'audio/ogg'],
      ['woff', 'font/woff'],
      ['woff2', 'font/woff2'],
      ['ttf', 'font/ttf'],
    ]);

    this.baseURI = '';
  }

  async load(values) {
    const isArray = values instanceof Array;

    if (!isArray) {
      values = [values];
    }

    const promises = [];

    for (const value of values) {
      if (!value) {
        continue;
      }

      const options = typeof value === 'string' ? { src: value } : Object.assign({}, value);

      const baseURI = options.baseURI !== undefined ? options.baseURI : this.baseURI;

      options.src = `${baseURI}${options.src}`;

      if (!options.type) {
        const extensionResults = /.*\.(.*)$/.exec(options.src);
        if (extensionResults) {
          options.type = this.extensionTypeMap.get(extensionResults[1]);
        }
      }

      promises.push(this._loadFile(options));
    }

    return isArray ? Promise.all(promises) : promises[0];
  }

  async _loadFile({ src, type = '', crossOrigin = undefined }) {
    return new Promise((resolve) => {
      if (type.startsWith('image') || type.startsWith('video') || type.startsWith('audio')) {
        resolve();
      } else {
        resolve(fetch(src));
      }
    }).catch(() => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest;
        xhr.onload = () => {
          resolve(new Response(xhr.responseText, { status: xhr.status }));
        };
        xhr.open('GET', `${this.baseURI}${src}`);
        xhr.send(null);
      });
    }).then((response) => {
      if (type === 'text/html') {
        return response.text().then((html) => {
          const template = document.createElement('template');
          template.innerHTML = html;
          return template;
        });
      } else if (type === 'text/css') {
        return new Promise((resolve) => {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.type = 'text/css';
          const onLoad = () => {
            link.removeEventListener('load', onLoad);
            resolve(link);
          };
          link.addEventListener('load', onLoad);
          link.href = src;
          document.head.appendChild(link);
        });
      } else if (type.startsWith('text')) {
        return response.text();
      } else if (type === 'application/json') {
        return response.json();
      } else if (type.startsWith('image')) {
        return new Promise((resolve) => {
          const image = document.createElement('img');
          image.crossOrigin = crossOrigin;
          image.onload = () => {
            resolve(image);
          };
          image.src = src;
        });
      } else if (type.startsWith('video') || type.startsWith('audio')) {
        return new Promise((resolve) => {
          const media = document.createElement(type.split('/')[0]);
          media.oncanplaythrough = () => {
            resolve(media);
          };
          media.src = src;
        });
      } else if (type.startsWith('font')) {
        return new Promise((resolve) => {
          const fontFace = new FontFace(/([^\/]*)\.(woff|woff2|ttf)$/.exec(src)[1], `url("${src}")`);
          document.fonts.add(fontFace);
          return fontFace.load();
        });
      } else if (type === 'application/octet-stream') {
        return response.arrayBuffer();
      } else {
        return response.blob();
      }
    });
  }
}

export default new Loader();
