import Ticker from './Ticker.js';

const animate = async (object, keyframes, { duration = 0, delay = 0, easing = (x) => x } = {}) => {
  let time = 0;
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

    for (const [key, value] of Object.entries(keyframes)) {
      object[key] = (value[1] - value[0]) * progress + value[0];
    }
  };
  Ticker.add(update);
};


export { animate };
