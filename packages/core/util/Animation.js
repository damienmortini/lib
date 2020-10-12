import Ticker from './Ticker.js';

const animate = (object, keyframes, { duration = 0, delay = 0, easing = (x) => x, onupdate = () => { } } = {}) => {
  let finishedResolve;
  const finished = new Promise((resolve) => finishedResolve = resolve);
  let time = 0;
  const keyframesMap = new Map(Object.entries(keyframes));
  for (const [key, value] of keyframesMap) {
    if (!(value instanceof Array)) {
      keyframesMap.set(key, [object[key], value]);
    }
  }
  const update = () => {
    duration = duration || 1;
    time += Ticker.deltaTime * 1000;

    let progress;
    if (time >= delay + duration) {
      Ticker.delete(update);
      progress = 1;
    } else {
      progress = Math.max(time - delay, 0) / duration;
      progress = easing(progress);
    }

    for (const [key, value] of keyframesMap) {
      object[key] = (value[1] - value[0]) * progress + value[0];
    }

    onupdate();

    if (progress === 1) {
      finishedResolve();
    }
  };
  Ticker.add(update);
  return {
    finished,
  };
};


export { animate };
