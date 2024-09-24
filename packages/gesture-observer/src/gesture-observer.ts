import type { Gesture } from './gesture.js';

type GestureObserverCallback = (gesture: Gesture) => void;

type ElementData = {
  pointers: Map<number, PointerEvent>;
  gestureVectorX: number;
  gestureVectorY: number;
  previousSize: number;
  previousX: number;
  previousY: number;
  offsetX: number;
  offsetY: number;
  previousMovementX: number;
  previousMovementY: number;
  previousRotation: number;
  startTimeStamp: number;
  pointerLock: boolean;
  pointerCapture: boolean;
};

export class GestureObserver {
  #elementsData: Map<HTMLElement | Window, ElementData> = new Map();
  #callback: GestureObserverCallback;

  constructor(callback: GestureObserverCallback) {
    this.#callback = callback;
  }

  observe(
    element: HTMLElement | Window,
    options: { pointerLock?: boolean; pointerCapture?: boolean } = {},
  ): void {
    let elementData = this.#elementsData.get(element);
    if (!elementData) {
      elementData = {
        pointers: new Map(),
        gestureVectorX: 0,
        gestureVectorY: 0,
        previousSize: 0,
        previousX: 0,
        previousY: 0,
        offsetX: 0,
        offsetY: 0,
        previousMovementX: 0,
        previousMovementY: 0,
        previousRotation: 0,
        startTimeStamp: 0,
        pointerLock: false,
        pointerCapture: false,
      };
      this.#elementsData.set(element, elementData);
    }
    elementData.pointerLock = options.pointerLock ?? false;
    elementData.pointerCapture = options.pointerCapture ?? false;
    element.addEventListener('pointerdown', this.#onPointerDown);
  }

  unobserve(element: HTMLElement | Window): void {
    if (!this.#elementsData.has(element)) return;
    element.removeEventListener('pointerdown', this.#onPointerDown);
    element.removeEventListener('pointermove', this.#onPointerMove);
    element.removeEventListener('pointerup', this.#onPointerUp);
    element.removeEventListener('pointerleave', this.#onPointerUp);
    this.#elementsData.delete(element);
  }

  disconnect(): void {
    for (const element of this.#elementsData.keys()) {
      this.unobserve(element);
    }
  }

  #resetElementPreviousData(element: HTMLElement | Window): void {
    const data = this.#elementsData.get(element);
    if (data) {
      data.gestureVectorX = 0;
      data.gestureVectorY = 0;
      data.previousSize = 0;
      data.previousX = 0;
      data.previousY = 0;
      data.previousRotation = 0;
    }
  }

  #onPointerDown = (event: PointerEvent): void => {
    const element = event.currentTarget as HTMLElement | Window;
    const data = this.#elementsData.get(element);

    if (!data) return;

    if (data.pointerLock && element instanceof HTMLElement) {
      element.requestPointerLock();
    }
    else if (data.pointerCapture && element instanceof HTMLElement) {
      element.setPointerCapture(event.pointerId);
    }

    this.#resetElementPreviousData(element);
    data.pointers.set(event.pointerId, event);
    if (data.pointers.size === 1) {
      element.addEventListener('pointermove', this.#onPointerMove);
      element.addEventListener('pointerup', this.#onPointerUp);
      element.addEventListener('pointerleave', this.#onPointerUp);
      data.startTimeStamp = Date.now();
      data.offsetX = 0;
      data.offsetY = 0;
      this.#callback({
        event,
        pointers: new Map(data.pointers),
        target: element,
        movementX: 0,
        movementY: 0,
        x: event.clientX,
        y: event.clientY,
        offsetX: 0,
        offsetY: 0,
        movementScale: 1,
        movementRotation: 0,
        duration: 0,
        state: 'starting',
      });
    }
  };

  #onPointerMove = (event: PointerEvent): void => {
    const element = event.currentTarget as HTMLElement | Window;
    const data = this.#elementsData.get(element);
    if (!data) return;

    data.pointers.set(event.pointerId, event);
    let x = 0;
    let y = 0;
    let index = 0;
    for (const pointer of data.pointers.values()) {
      if (index === 1) {
        data.gestureVectorX = x - pointer.clientX;
        data.gestureVectorY = y - pointer.clientY;
      }
      x += pointer.clientX;
      y += pointer.clientY;
      index++;
    }
    x /= data.pointers.size;
    y /= data.pointers.size;

    if (data.previousX === 0 && data.previousY === 0) {
      data.previousX = x;
      data.previousY = y;
      return;
    }

    const movementX = x - data.previousX;
    const movementY = y - data.previousY;
    data.previousX = x;
    data.previousY = y;
    data.previousMovementX = movementX;
    data.previousMovementY = movementY;

    const size = Math.hypot(data.gestureVectorX, data.gestureVectorY);
    const movementScale = data.previousSize ? size / data.previousSize : 1;
    data.previousSize = size;

    const rotation = Math.atan2(data.gestureVectorY, data.gestureVectorX);
    let movementRotation = data.previousRotation ? rotation - data.previousRotation : 0;
    if (movementRotation > Math.PI) {
      movementRotation -= Math.PI * 2;
    }
    else if (movementRotation < -Math.PI) {
      movementRotation += Math.PI * 2;
    }
    data.previousRotation = rotation;

    data.offsetX += movementX;
    data.offsetY += movementY;

    this.#callback({
      event,
      pointers: new Map(data.pointers),
      target: element,
      movementX: data.pointerLock && event instanceof PointerEvent && 'movementX' in event
        ? event.movementX / devicePixelRatio
        : movementX,
      movementY: data.pointerLock && event instanceof PointerEvent && 'movementY' in event
        ? event.movementY / devicePixelRatio
        : movementY,
      x,
      y,
      offsetX: data.offsetX,
      offsetY: data.offsetY,
      movementScale,
      movementRotation,
      duration: Date.now() - data.startTimeStamp,
      state: 'moving',
    });
  };

  #onPointerUp = (event: PointerEvent): void => {
    const element = event.currentTarget as HTMLElement | Window;
    const data = this.#elementsData.get(element);
    if (!data) return;

    data.pointers.delete(event.pointerId);
    if (element instanceof HTMLElement) {
      element.releasePointerCapture(event.pointerId);
    }
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
    if (data.pointers.size === 0) {
      this.#callback({
        event,
        pointers: new Map(),
        target: element,
        movementX: 0,
        movementY: 0,
        movementScale: 1,
        movementRotation: 0,
        x: data.previousX,
        y: data.previousY,
        offsetX: data.offsetX,
        offsetY: data.offsetY,
        duration: Date.now() - data.startTimeStamp,
        state: 'finishing',
      });
      element.removeEventListener('pointermove', this.#onPointerMove);
      element.removeEventListener('pointerup', this.#onPointerUp);
      element.removeEventListener('pointerleave', this.#onPointerUp);
    }
    this.#resetElementPreviousData(element);
  };
}
