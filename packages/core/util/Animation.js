import Ticker from './Ticker.js';

const animate = (target, keyframes, { duration = 0, delay = 0, easing = (x) => x, onupdate = () => { }, fill = 'none' } = {}) => {
  let finishedResolve;
  const finished = new Promise((resolve) => finishedResolve = resolve);
  let time = 0;
  const keyframesMap = new Map(Object.entries(keyframes));

  /**
   * Set init value as undefined if it doesn't exist
   */
  for (const [key, value] of keyframesMap) {
    if (!(value instanceof Array)) {
      keyframesMap.set(key, [undefined, value]);
    }
  }

  /**
   * Update loop
   */
  const update = () => {
    duration = duration || 1;
    time += Ticker.deltaTime;

    let progress;
    let needsUpdate = true;
    if (time <= delay) {
      progress = 0;
      needsUpdate = (fill === 'both' || fill === 'backwards');
    } else if (time >= delay + duration) {
      progress = 1;
    } else {
      progress = Math.max(time - delay, 0) / duration;
      progress = easing(progress);
    }

    if (needsUpdate) {
      for (const [key, value] of keyframesMap) {
        if (value[0] === undefined) value[0] = target[key];
        target[key] = (value[1] - value[0]) * progress + value[0];
      }
    }

    onupdate();

    if (progress === 1) {
      if (fill !== 'both' && fill !== 'forwards') {
        Ticker.delete(update);
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
