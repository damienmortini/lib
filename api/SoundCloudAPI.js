let PROMISE;

export default class SoundCloudAPI {
  static load() {
    PROMISE = PROMISE || new Promise((resolve) => {
      let script = document.createElement("script");
      script.onload = resolve;
      script.src = "//w.soundcloud.com/player/api.js";
      document.head.appendChild(script);
    });
    return PROMISE;
  }
}