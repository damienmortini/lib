import { strictEqual } from 'node:assert';
import { beforeEach, describe, it } from 'node:test';

import NumberInputElement from '../index.js';

const inputFor = (element: NumberInputElement): HTMLInputElement => element.shadowRoot!.querySelector('input')!;

beforeEach(() => {
  document.body.replaceChildren();
});

describe('NumberInputElement', () => {
  it('applies a programmatic value set silently', () => {
    const element = new NumberInputElement();
    document.body.appendChild(element);

    let events = 0;
    element.addEventListener('input', () => events++);
    element.addEventListener('change', () => events++);

    element.value = 5;

    strictEqual(element.value, 5);
    strictEqual(events, 0);
  });

  it('applies the value attribute silently', () => {
    const element = new NumberInputElement();
    document.body.appendChild(element);

    let events = 0;
    element.addEventListener('change', () => events++);

    element.setAttribute('value', '3');

    strictEqual(element.value, 3);
    strictEqual(events, 0);
  });

  it('re-dispatches a user edit as a bubbling change on the host', () => {
    const element = new NumberInputElement();
    document.body.appendChild(element);

    let changes = 0;
    let bubbled = 0;
    element.addEventListener('change', () => changes++);
    document.body.addEventListener('change', () => bubbled++);

    const input = inputFor(element);
    input.valueAsNumber = 7;
    input.dispatchEvent(new Event('change'));

    strictEqual(element.value, 7);
    strictEqual(changes, 1);
    strictEqual(bubbled, 1);
  });
});
