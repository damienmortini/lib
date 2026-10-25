import type { Gesture } from './gesture.js';

type GestureObserverCallback = (gesture: Gesture) => void;

// Pointer lock and capture are an element's: a window observed takes neither.
export interface GestureObserverOptions {
  pointerLock?: boolean;
  pointerCapture?: boolean;
  /** Which presses start or join a gesture, asked before any capture or lock: the others stay with the page. */
  filter?: (event: PointerEvent) => boolean;
}

type ElementData = {
  options: GestureObserverOptions;
  pointers: Map<number, PointerEvent>;
  target: EventTarget;
  // Where the pointers were at the last event, the next one measured from it.
  x: number;
  y: number;
  size: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
  startTimeStamp: number;
};

type Movement = Partial<Pick<Gesture, 'movementX' | 'movementY' | 'movementScale' | 'movementRotation'>>;

const END_EVENTS = ['pointerup', 'pointercancel', 'lostpointercapture', 'pointerleave'] as const;

// The pointers' centroid, and the vector from the second pointer to the first.
function measure(pointers: Map<number, PointerEvent>): Pick<ElementData, 'x' | 'y' | 'size' | 'rotation'> {
  let x = 0;
  let y = 0;
  for (const pointer of pointers.values()) {
    x += pointer.clientX;
    y += pointer.clientY;
  }
  const [first, second] = pointers.values();
  const vectorX = second ? first.clientX - second.clientX : 0;
  const vectorY = second ? first.clientY - second.clientY : 0;
  return { x: x / pointers.size, y: y / pointers.size, size: Math.hypot(vectorX, vectorY), rotation: Math.atan2(vectorY, vectorX) };
}

export class GestureObserver {
  #elementsData: Map<HTMLElement | Window, ElementData> = new Map();
  #callback: GestureObserverCallback;

  constructor(callback: GestureObserverCallback) {
    this.#callback = callback;
  }

  observe(element: HTMLElement | Window, options: GestureObserverOptions = {}): void {
    const data = this.#elementsData.get(element);
    if (data) {
      data.options = options;
      return;
    }
    this.#elementsData.set(element, { options, pointers: new Map(), target: element, x: 0, y: 0, size: 0, rotation: 0, offsetX: 0, offsetY: 0, startTimeStamp: 0 });
    element.addEventListener('pointerdown', this.#onPointerDown);
  }

  unobserve(element: HTMLElement | Window): void {
    if (!this.#elementsData.delete(element)) return;
    element.removeEventListener('pointerdown', this.#onPointerDown);
    this.#listen(element, false);
  }

  disconnect(): void {
    for (const element of this.#elementsData.keys()) {
      this.unobserve(element);
    }
  }

  #listen(element: HTMLElement | Window, listen: boolean): void {
    const method = listen ? 'addEventListener' : 'removeEventListener';
    element[method]('pointermove', this.#onPointerMove as EventListener);
    for (const type of END_EVENTS) element[method](type, this.#onPointerEnd as EventListener);
  }

  #notify(data: ElementData, element: HTMLElement | Window, event: PointerEvent, state: Gesture['state'], movement: Movement = {}): void {
    this.#callback({
      event,
      pointers: new Map(data.pointers),
      target: data.target,
      currentTarget: element,
      x: data.x,
      y: data.y,
      movementX: 0,
      movementY: 0,
      movementScale: 1,
      movementRotation: 0,
      ...movement,
      offsetX: data.offsetX,
      offsetY: data.offsetY,
      duration: event.timeStamp - data.startTimeStamp,
      state,
    });
  }

  #onPointerDown = (event: PointerEvent): void => {
    const element = event.currentTarget as HTMLElement | Window;
    const data = this.#elementsData.get(element);
    if (!data || (data.options.filter && !data.options.filter(event))) return;

    if (data.options.pointerCapture && !data.options.pointerLock && 'setPointerCapture' in element) element.setPointerCapture(event.pointerId);

    data.pointers.set(event.pointerId, event);
    // A pointer joining moves the centroid without moving anything: measured from here.
    Object.assign(data, measure(data.pointers));
    if (data.pointers.size > 1) return;
    if (data.options.pointerLock && 'requestPointerLock' in element) element.requestPointerLock();
    this.#listen(element, true);
    Object.assign(data, { target: event.target ?? element, offsetX: 0, offsetY: 0, startTimeStamp: event.timeStamp });
    this.#notify(data, element, event, 'starting');
  };

  #onPointerMove = (event: PointerEvent): void => {
    const element = event.currentTarget as HTMLElement | Window;
    const data = this.#elementsData.get(element);
    if (!data?.pointers.has(event.pointerId)) return;

    data.pointers.set(event.pointerId, event);
    const { x, y, size, rotation } = measure(data.pointers);
    const movementX = x - data.x;
    const movementY = y - data.y;
    // Turned into (-π, π], so crossing the axis is a small turn, not a whole one.
    const turn = rotation - data.rotation;
    const movementRotation = data.size ? Math.atan2(Math.sin(turn), Math.cos(turn)) : 0;
    const movementScale = data.size ? size / data.size : 1;
    Object.assign(data, { x, y, size, rotation, offsetX: data.offsetX + movementX, offsetY: data.offsetY + movementY });

    const locked = data.options.pointerLock;
    this.#notify(data, element, event, 'moving', {
      movementX: locked ? event.movementX / devicePixelRatio : movementX,
      movementY: locked ? event.movementY / devicePixelRatio : movementY,
      movementScale,
      movementRotation,
    });
  };

  // A pointer ends once, the capture lost or the element left after its pointerup finding it gone. A capture
  // lost by a child, as a touch's implicit one is to this element's own, is no end.
  #onPointerEnd = (event: PointerEvent): void => {
    const element = event.currentTarget as HTMLElement | Window;
    const data = this.#elementsData.get(element);
    if (event.type === 'lostpointercapture' && event.target !== element) return;
    if (!data?.pointers.delete(event.pointerId)) return;

    if (data.pointers.size) {
      Object.assign(data, measure(data.pointers));
      return;
    }
    this.#listen(element, false);
    if (data.options.pointerLock && document.pointerLockElement === element) document.exitPointerLock();
    this.#notify(data, element, event, 'finishing');
  };
}
