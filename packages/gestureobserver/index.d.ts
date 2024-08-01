export class GestureObserver {
  /**
   * @typedef Gesture
   * @property {HTMLElement} target - The target DOM Element
   * @property {Map<number, PointerEvent>} pointers - Map of active pointers
   * @property {Event} event - Event that triggered the gesture
   * @property {number} x - Gesture position on the X axis
   * @property {number} y - Gesture position on the Y axis
   * @property {number} movementX - Movement on the X axis
   * @property {number} movementY - Movement on the Y axis
   * @property {number} offsetX - Offset between gesture start and gesture end on the X axis
   * @property {number} offsetY - Offset between gesture start and gesture end on the Y axis
   * @property {number} movementScale - Pinch-zoom movement
   * @property {number} movementRotation - Angular movement in radians
   * @property {number} duration - Duration of the gesture
   * @property {("starting"|"moving"|"finishing")} state - State of the gesture
   */
  /**
   * @callback GestureObserverCallback
   * @param {Gesture} gesture - Current gesture changes
   */
  /**
   * @param {GestureObserverCallback} callback
   */
  constructor(
    callback: (gesture: {
      /**
       * - The target DOM Element
       */
      target: HTMLElement;
      /**
       * - Map of active pointers
       */
      pointers: Map<number, PointerEvent>;
      /**
       * - Event that triggered the gesture
       */
      event: Event;
      /**
       * - Gesture position on the X axis
       */
      x: number;
      /**
       * - Gesture position on the Y axis
       */
      y: number;
      /**
       * - Movement on the X axis
       */
      movementX: number;
      /**
       * - Movement on the Y axis
       */
      movementY: number;
      /**
       * - Offset between gesture start and gesture end on the X axis
       */
      offsetX: number;
      /**
       * - Offset between gesture start and gesture end on the Y axis
       */
      offsetY: number;
      /**
       * - Pinch-zoom movement
       */
      movementScale: number;
      /**
       * - Angular movement in radians
       */
      movementRotation: number;
      /**
       * - Duration of the gesture
       */
      duration: number;
      /**
       * - State of the gesture
       */
      state: 'starting' | 'moving' | 'finishing';
    }) => any,
  );
  /**
   * Observe gesture changes on the specified target element.
   * @param {HTMLElement|Window} element Element to observe
   */
  observe(
    element: HTMLElement | Window,
    {
      pointerLock,
      pointerCapture,
    }?: {
      pointerLock?: boolean;
      pointerCapture?: boolean;
    },
  ): void;
  /**
   * Stop observing gesture changes on the specified target element.
   * @param {HTMLElement|Window} element Element to unobserve
   */
  unobserve(element: HTMLElement | Window): void;
  /**
   * Stops watching all of its target elements for gesture changes.
   */
  disconnect(): void;
  #private;
}
