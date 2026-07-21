[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

# Animation

Tiny keyframe animation helper. Tweens numeric properties of any object over
time, driven by [`@damienmortini/ticker`](../ticker).

## Install

```bash
npm install @damienmortini/animation
```

## `animate(target, keyframes, options?)`

Animates numeric properties of `target` towards the values described in
`keyframes`. Returns an object with a `finished` promise and a `cancel` method.

### Parameters

| Parameter   | Type                       | Description                                                      |
| ----------- | -------------------------- | ---------------------------------------------------------------- |
| `target`    | `Record<string, number>`   | The object whose numeric properties are animated.                |
| `keyframes` | `Keyframes<Target>`        | Map of property → destination value or `[from, to]` pair.        |
| `options`   | `AnimateOptions`           | Optional timing/easing configuration (see below).                |

### Options

| Option     | Type                            | Default        | Description                                                        |
| ---------- | ------------------------------- | -------------- | ------------------------------------------------------------------ |
| `duration` | `number`                        | `0`            | Duration in milliseconds.                                          |
| `delay`    | `number`                        | `0`            | Delay in milliseconds before the tween starts.                     |
| `easing`   | `(progress: number) => number`  | `x => x`       | Easing function mapping linear `[0,1]` progress to eased progress. |
| `onupdate` | `() => void`                    | `() => {}`     | Called every frame after the target has been updated.              |
| `fill`     | `'none' \| 'forwards' \| 'backwards' \| 'both'` | `'none'` | Whether values are held before/after the active period.  |

### Returns

| Property   | Type              | Description                                          |
| ---------- | ----------------- | ---------------------------------------------------- |
| `finished` | `Promise<void>`   | Resolves when the animation reaches its end.         |
| `cancel`   | `() => void`      | Stops the animation immediately.                     |

## Examples

### Basic tween

Animate a property from its current value to a target value:

```js
import { animate } from '@damienmortini/animation';

const object = { x: 0 };

animate(object, { x: 100 }, { duration: 1000 });
```

### Explicit `[from, to]`

Provide a start and end value instead of reading the current one:

```js
animate(element.style, { opacity: [0, 1] }, { duration: 500 });
```

### Multiple properties

Every numeric property listed is tweened together:

```js
animate(sprite, { x: 200, y: -50, rotation: Math.PI }, { duration: 800 });
```

### Easing

Pass any easing function. Pair it with [`@damienmortini/math`](../math)'s
`Easing` helpers:

```js
import { animate } from '@damienmortini/animation';
import { Easing } from '@damienmortini/math';

animate(camera, { zoom: 2 }, {
  duration: 1200,
  easing: Easing.easeOutCubic,
});
```

### `onupdate` callback

Run side effects every frame, e.g. to push values into a render loop:

```js
animate(uniforms.time, { value: 1 }, {
  duration: 2000,
  onupdate: () => {
    material.needsUpdate = true;
  },
});
```

### Awaiting completion

`finished` lets you sequence animations with `async`/`await`:

```js
await animate(panel, { y: 0 }, { duration: 300 }).finished;
await animate(panel, { opacity: 1 }, { duration: 200 }).finished;
```

### Cancelling

```js
const animation = animate(object, { x: 100 }, { duration: 1000 });

// Later, stop it wherever it is:
animation.cancel();
```

### Delay and fill

`delay` waits before starting; `fill` controls whether the target is held at the
start value during the delay (`backwards`/`both`) and at the end value after
completion (`forwards`/`both`):

```js
animate(badge, { scale: [0, 1] }, {
  delay: 500,
  duration: 400,
  fill: 'both',
});
```

## Notes

Animating the same property on the same target again automatically supersedes
the previous keyframe for that property, so overlapping calls don't fight each
other.
