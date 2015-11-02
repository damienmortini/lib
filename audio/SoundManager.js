import {Howler, Howl} from "howler";

let soundMap = new Map();

if(/mute/.test(window.location.search)) {
  Howler.mute();
}

export default class SoundManager {
  static add(url, options) {
    let sound = new Howl({
      urls: [url]
    });
    Object.assign(sound, options);
    let split = url.split("/");
    let name = split[split.length - 1].split(".")[0];
    soundMap.set(name, sound);
    return sound;
  }
  static play(name, options) {
    let sound = soundMap.get(name);
    Object.assign(sound, options);
    sound.play();
    return sound;
  }
}
