import Ticker from './Ticker.js';

const keyframesSetObjectMap = new Map();

const animate = (object, keyframes, { duration = 0, delay = 0, easing = (x) => x, onupdate = () => { } } = {}) => {
  let finishedResolve;
  const finished = new Promise((resolve) => finishedResolve = resolve);
  let time = 0;
  const keyframesMap = new Map(Object.entries(keyframes));
  /**
   * Set init value as current value if it doesn't exist
   */
  for (const [key, value] of keyframesMap) {
    if (!(value instanceof Array)) {
      keyframesMap.set(key, [object[key], value]);
    }
  }
  /**
   * Overwrite keyframes
   */
  let keyframesSet = keyframesSetObjectMap.get(object);
  if (!keyframesSet) {
    keyframesSet = new Set();
    keyframesSetObjectMap.set(object, keyframesSet);
  }
  for (const key of keyframesMap.keys()) {
    for (const previousKeyframes of keyframesSet) {
      previousKeyframes.delete(key);
      if (!previousKeyframes.size) {
        keyframesSet.delete(previousKeyframes);
      }
    }
  }
  keyframesSet.add(keyframesMap);

  /**
   * Update loop
   */
  const update = () => {
    duration = duration || 1;
    time += Ticker.deltaTime * 1000;

    let progress;
    if (time >= delay + duration) {
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
      Ticker.delete(update);
      keyframesSet.delete(keyframesMap);
      if (!keyframesSet.size) {
        keyframesSetObjectMap.delete(object);
      }
      finishedResolve();
    }
  };

  update();
  Ticker.add(update);

  return {
    finished,
    cancel: () => {
      Ticker.delete(update);
    },
  };
};


export { animate };
