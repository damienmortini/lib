import '../index.js';

import { strictEqual } from 'node:assert';
import { beforeEach, describe, it } from 'node:test';

const pointer = (type: string, offsetX: number): PointerEvent => {
  const event = new PointerEvent(type, {
    bubbles: true,
    buttons: 1,
    pointerId: 1,
  });
  // jsdom computes no layout, so the offset the element reads is supplied directly.
  Object.defineProperty(event, 'offsetX', { value: offsetX });
  return event;
};

const create = (): HTMLElement & { value: number } => {
  const element = document.createElement('damo-input-ruler') as HTMLElement & { value: number };
  // jsdom computes no layout, so the scroll width the drag divides by is supplied directly.
  Object.defineProperty(element, 'scrollWidth', { value: 300 });
  return element;
};

const nextFrame = (): Promise<void> => new Promise(resolve => requestAnimationFrame(() => resolve()));

beforeEach(() => {
  document.body.replaceChildren();
});

describe('RulerInputElement', () => {
  it('applies a programmatic value set silently, snapped and clamped', () => {
    const element = create();
    document.body.appendChild(element);

    let events = 0;
    element.addEventListener('input', () => events++);
    element.addEventListener('change', () => events++);

    element.value = 5.4;
    strictEqual(element.value, 5);

    element.value = 200;
    strictEqual(element.value, 100);

    strictEqual(events, 0);
  });

  it('fires input while dragging and change on release', async () => {
    const element = create();
    document.body.appendChild(element);

    let inputs = 0;
    let changes = 0;
    element.addEventListener('input', () => inputs++);
    element.addEventListener('change', () => changes++);

    element.dispatchEvent(pointer('pointerdown', 0));
    element.dispatchEvent(pointer('pointermove', 150));
    await nextFrame();
    strictEqual(element.value, 50);
    strictEqual(inputs, 1);
    strictEqual(changes, 0);

    element.dispatchEvent(pointer('pointerup', 150));
    strictEqual(changes, 1);
  });

  it('fires no change on a release without movement', () => {
    const element = create();
    document.body.appendChild(element);

    let changes = 0;
    element.addEventListener('change', () => changes++);

    element.dispatchEvent(pointer('pointerdown', 0));
    element.dispatchEvent(pointer('pointerup', 0));

    strictEqual(changes, 0);
  });
});
