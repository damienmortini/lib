import {Howler, Howl} from "howler";

let soundMap = new Map();

let muteLooped = /\bmutelooped\b/.test(window.location.search);

let enabled = true;
let muted = false;

export default class SoundManager {
  static add(url, {loop = false} = {}) {
    let split = url.split("/");
    let name = split[split.length - 1].split(".")[0];
    if(soundMap.get(name)) {
      console.warn(`Sound ${name} is added twice`);
      return;
    }
    let sound = new Howl({
      urls: [url],
      loop: loop
    });
    soundMap.set(name, sound);
  }
  static play(name, {loop = undefined} = {}) {
    let sound = soundMap.get(name);
    if(!sound) {
      console.error(`Sound ${name} hasn't been added`);
      return;
    }
    if(loop !== undefined) {
      sound.loop(loop);
    }
    if(sound.loop() && muteLooped) {
      sound.mute();
    }
    sound.play();
  }
  static stop(name) {
    let sound = soundMap.get(name);
    sound.stop();
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
    if(!enabled) {
      return;
    }
    muted = false;
    Howler.unmute();
  }
}

if(/\bmute\b/.test(window.location.search)) {
  enabled = false;
  SoundManager.mute();
}
