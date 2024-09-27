export type Gesture = {
  target: EventTarget;
  currentTarget: EventTarget;
  pointers: Map<number, PointerEvent>;
  event: PointerEvent;
  x: number;
  y: number;
  movementX: number;
  movementY: number;
  offsetX: number;
  offsetY: number;
  movementScale: number;
  movementRotation: number;
  duration: number;
  state: 'starting' | 'moving' | 'finishing';
};
