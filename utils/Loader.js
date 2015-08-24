export default class Loader {
  static loadImage(url) {
    return new Promise(function(resolve, reject) {
      let image = new Image();
      image.onload = () => {
        resolve(image);
      };
      image.src = url;
    });
  }
}
