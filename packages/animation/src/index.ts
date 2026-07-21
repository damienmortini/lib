import Ticker from '@damienmortini/ticker';

/**
 * The numeric subset of a value in the Web Animations API property-indexed
 * form (a value in `PropertyIndexedKeyframes`): either a single destination
 * value — the start value is read from the target when the animation begins —
 * or a list of values to interpolate through. Only the first and last entries
 * of a list are used.
 *
 * The DOM's own `Keyframe` type is the array-form keyframe *object* (e.g.
 * `{ opacity: 1 }`); this is the per-property *value* used in the object form,
 * and is assignable to `PropertyIndexedKeyframes[string]`.
 */
export type KeyframeValue = number | number[];

/**
 * Property-indexed keyframes: the numeric-restricted analogue of the Web
 * Animations API's `PropertyIndexedKeyframes`, as passed to
 * `element.animate({ opacity: [0, 1] }, ...)`. Only numeric properties of the
 * target may be animated. A value of this type is assignable to
 * `PropertyIndexedKeyframes`.
 */
export type Keyframes<Target> = {
  [Key in keyof Target as Target[Key] extends number ? Key : never]?: KeyframeValue;
};

export type AnimateOptions = {
  duration?: number;
  delay?: number;
  easing?: (progress: number) => number;
  onupdate?: () => void;
  fill?: 'none' | 'forwards' | 'backwards' | 'both';
};

export type Animation = {
  finished: Promise<void>;
  cancel: () => void;
};

const targetComputedKeyframesMap = new Map<object, Set<Map<string, [number, number]>>>();

export const animate = <Target extends Record<string, number>>(
  target: Target,
  keyframes: Keyframes<Target>,
  { duration = 0, delay = 0, easing = (x) => x, onupdate = () => {}, fill = 'none' }: AnimateOptions = {},
): Animation => {
  let time = 0;

  let finishedResolve!: () => void;
  const finished = new Promise<void>((resolve) => (finishedResolve = resolve));

  // Get target computed keyframes Set
  let targetComputedKeyframes = targetComputedKeyframesMap.get(target);
  if (!targetComputedKeyframes) {
    targetComputedKeyframes = new Set();
    targetComputedKeyframesMap.set(target, targetComputedKeyframes);
  }

  const computedKeyframes = new Map(Object.entries(keyframes) as [string, KeyframeValue][]);

  for (const previousComputedKeyframes of targetComputedKeyframes) {
    for (const key of computedKeyframes.keys()) {
      previousComputedKeyframes.delete(key);
    }
  }

  const resolvedKeyframes = new Map<string, [number, number]>();

  /**
   * Set init value as current value if it doesn't exist
   */
  for (const [key, value] of computedKeyframes) {
    resolvedKeyframes.set(key, value instanceof Array ? [value[0], value[value.length - 1]] : [target[key], value]);
  }

  targetComputedKeyframes.add(resolvedKeyframes);

  /**
   * Update loop
   */
  const update = () => {
    duration = duration || 1;
    time += Ticker.deltaTime;

    let progress: number;
    let needsUpdate = true;
    if (time <= delay) {
      progress = 0;
      needsUpdate = fill === 'both' || fill === 'backwards';
    } else if (time >= delay + duration) {
      progress = 1;
    } else {
      progress = Math.max(time - delay, 0) / duration;
      progress = easing(progress);
    }

    if (needsUpdate) {
      for (const [key, [from, to]] of resolvedKeyframes) {
        (target as Record<string, number>)[key] = (to - from) * progress + from;
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
