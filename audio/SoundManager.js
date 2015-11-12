import {Howler, Howl} from "howler";

let soundMap = new Map();

let muteLooped = /\bmutelooped\b/.test(window.location.search);

let muted = false;

export default class SoundManager {
  static add(url, {loop = false} = {}) {
    let sound = new Howl({
      urls: [url],
      loop: loop
    });
    let split = url.split("/");
    let name = split[split.length - 1].split(".")[0];
    soundMap.set(name, sound);
  }
  static play(name, {loop = undefined} = {}) {
    let sound = soundMap.get(name);
    if(loop !== undefined) {
      sound.loop(loop);
    }
    if(sound.loop() && muteLooped) {
      sound.mute();
    }
    sound.play();
  }
  static toggleMute() {
    if(muted) {
      SoundManager.unmute();
    } else {
      SoundManager.mute();
    }
  }
  static mute() {
    muted = true;
    Howler.mute();
  }
  static unmute() {
    muted = false;
    Howler.unmute();
  }
}

if(/\bmute\b/.test(window.location.search)) {
  SoundManager.mute();
}
