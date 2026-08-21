import '../index.js';

import { ok, strictEqual } from 'node:assert';
import { beforeEach, describe, it } from 'node:test';

const pointer = (type: string, clientX: number, clientY: number): PointerEvent => new PointerEvent(type, {
  bubbles: true,
  clientX,
  clientY,
  pointerId: 1,
});

const create = (): HTMLElement & { value: number } => document.createElement('damo-input-knob') as HTMLElement & { value: number };

beforeEach(() => {
  document.body.replaceChildren();
});

describe('KnobInputElement', () => {
  it('applies a programmatic value set silently', () => {
    const element = create();
    document.body.appendChild(element);

    let events = 0;
    element.addEventListener('input', () => events++);
    element.addEventListener('change', () => events++);

    element.value = 1;

    strictEqual(element.value, 1);
    strictEqual(events, 0);
  });

  it('fires input while turning and change on release', () => {
    const element = create();
    document.body.appendChild(element);

    let inputs = 0;
    let changes = 0;
    element.addEventListener('input', () => inputs++);
    element.addEventListener('change', () => changes++);

    element.dispatchEvent(pointer('pointerdown', 0, 10));
    element.dispatchEvent(pointer('pointermove', 10, 0));
    strictEqual(inputs, 1);
    strictEqual(changes, 0);

    element.dispatchEvent(pointer('pointerup', 10, 0));
    strictEqual(changes, 1);
    ok(Math.abs(element.value - Math.PI / 2) < 1e-9);
  });

  it('fires nothing on a press without movement', () => {
    const element = create();
    document.body.appendChild(element);

    let events = 0;
    element.addEventListener('input', () => events++);
    element.addEventListener('change', () => events++);

    element.dispatchEvent(pointer('pointerdown', 0, 10));
    element.dispatchEvent(pointer('pointerup', 0, 10));

    strictEqual(events, 0);
    strictEqual(element.value, 0);
  });
});
