import Ticker from '@damienmortini/ticker';

const targetComputedKeyframesMap = new Map();

const animate = (target, keyframes, { duration = 0, delay = 0, easing = x => x, onupdate = () => {}, fill = 'none' } = {}) => {
  let time = 0;

  let finishedResolve;
  const finished = new Promise(resolve => (finishedResolve = resolve));

  // Get target computed keyframes Set
  let targetComputedKeyframes = targetComputedKeyframesMap.get(target);
  if (!targetComputedKeyframes) {
    targetComputedKeyframes = new Set();
    targetComputedKeyframesMap.set(target, targetComputedKeyframes);
  }

  const computedKeyframes = new Map(Object.entries(keyframes));

  for (const previousComputedKeyframes of targetComputedKeyframes) {
    for (const key of computedKeyframes.keys()) {
      previousComputedKeyframes.delete(key);
    }
  }

  targetComputedKeyframes.add(computedKeyframes);

  /**
   * Set init value as current value if it doesn't exist
   */
  for (const [key, value] of computedKeyframes) {
    if (!(value instanceof Array)) {
      computedKeyframes.set(key, [target[key], value]);
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
      needsUpdate = fill === 'both' || fill === 'backwards';
    }
    else if (time >= delay + duration) {
      progress = 1;
    }
    else {
      progress = Math.max(time - delay, 0) / duration;
      progress = easing(progress);
    }

    if (needsUpdate) {
      for (const [key, value] of computedKeyframes) {
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
