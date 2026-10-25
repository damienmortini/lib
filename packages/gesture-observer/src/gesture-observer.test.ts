import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'node:test';

import type { Gesture } from './gesture.ts';
import { GestureObserver } from './gesture-observer.ts';

interface FakeElement extends EventTarget {
  captured: number[];
  setPointerCapture(pointerId: number): void;
}

function fakeElement(): FakeElement {
  const element = new EventTarget() as FakeElement;
  element.captured = [];
  element.setPointerCapture = pointerId => element.captured.push(pointerId);
  return element;
}

function pointer(target: EventTarget, type: string, pointerId: number, clientX: number, clientY = 0, isPrimary = true): void {
  target.dispatchEvent(Object.assign(new Event(type), { pointerId, clientX, clientY, isPrimary }));
}

function observe(element: FakeElement, filter?: (event: PointerEvent) => boolean): Gesture[] {
  const gestures: Gesture[] = [];
  new GestureObserver(gesture => gestures.push(gesture)).observe(element as unknown as HTMLElement, { pointerCapture: true, filter });
  return gestures;
}

function summary(gestures: Gesture[]): unknown[] {
  return gestures.map(({ state, x, offsetX, movementX }) => ({ state, x, offsetX, movementX }));
}

describe('GestureObserver', () => {
  it('counts the move from the press, the first one included, and ends where the pointer was', () => {
    const element = fakeElement();
    const gestures = observe(element);
    pointer(element, 'pointerdown', 1, 10);
    pointer(element, 'pointermove', 1, 15);
    pointer(element, 'pointermove', 1, 18);
    pointer(element, 'pointerup', 1, 18);
    pointer(element, 'lostpointercapture', 1, 18);
    deepStrictEqual(summary(gestures), [
      { state: 'starting', x: 10, offsetX: 0, movementX: 0 },
      { state: 'moving', x: 15, offsetX: 5, movementX: 5 },
      { state: 'moving', x: 18, offsetX: 8, movementX: 3 },
      { state: 'finishing', x: 18, offsetX: 8, movementX: 0 },
    ]);
    deepStrictEqual(element.captured, [1]);
  });

  it('ends on a cancel, and on the capture lost by the element but not by a child', () => {
    const element = fakeElement();
    const gestures = observe(element);
    pointer(element, 'pointerdown', 1, 0);
    pointer(element, 'pointercancel', 1, 0);
    // A cancelled touch leaves nothing behind: the next press is a gesture of its own.
    pointer(element, 'pointerdown', 2, 0);
    const child = new EventTarget();
    pointer(child, 'lostpointercapture', 2, 0);
    element.dispatchEvent(Object.assign(new Event('lostpointercapture'), { pointerId: 2 }));
    deepStrictEqual(gestures.map(gesture => [gesture.state, gesture.pointers.size]), [['starting', 1], ['finishing', 0], ['starting', 1], ['finishing', 0]]);
  });

  it('leaves the presses its filter turns down to the page, uncaptured', () => {
    const element = fakeElement();
    const gestures = observe(element, event => event.isPrimary);
    pointer(element, 'pointerdown', 1, 0);
    pointer(element, 'pointerdown', 2, 100, 0, false);
    pointer(element, 'pointermove', 2, 200, 0, false);
    pointer(element, 'pointermove', 1, 4);
    deepStrictEqual(summary(gestures), [
      { state: 'starting', x: 0, offsetX: 0, movementX: 0 },
      { state: 'moving', x: 4, offsetX: 4, movementX: 4 },
    ]);
    deepStrictEqual(element.captured, [1]);
  });

  it('pinches from where the second finger landed, without a jump', () => {
    const element = fakeElement();
    const gestures = observe(element);
    pointer(element, 'pointerdown', 1, 0);
    pointer(element, 'pointerdown', 2, 100);
    pointer(element, 'pointermove', 2, 200);
    const pinch = gestures.at(-1)!;
    strictEqual(pinch.movementScale, 2);
    strictEqual(pinch.movementX, 50);
    pointer(element, 'pointerup', 2, 200);
    pointer(element, 'pointermove', 1, 10);
    strictEqual(gestures.at(-1)!.movementX, 10);
  });
});
