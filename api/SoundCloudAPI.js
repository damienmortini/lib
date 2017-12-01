export default class SoundCloudAPI {
  static load() {
    return new Promise((resolve) => {
      if(document.querySelector(`script[src$="//w.soundcloud.com/player/api.js"]`)) {
        resolve();
      }
    
      let script = document.createElement("script");
      script.onload = resolve;
      script.src = "//w.soundcloud.com/player/api.js";
      document.head.appendChild(script);
    });;
  }
}