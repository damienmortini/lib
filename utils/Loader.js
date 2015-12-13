let files = new Map();

export default class Loader {
  static loadImages(urls, options) {
    let promises = [];
    for(let url of urls) {
      promises.push(Loader.loadImage(url, options));
    }
    return Promise.all(promises);
  }
  static loadImage(url, {crossOrigin = null} = {}) {
    let image = files.get(url);
    if(image) {
      return Promise.resolve(image);
    }
    return new Promise(function(resolve, reject) {
      image = new Image();
      image.crossOrigin = crossOrigin;
      image.onload = () => {
        resolve(image);
      };
      image.src = url;
    });
  }
}
