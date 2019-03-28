export default class PointerEventPolyfill {
  static apply(element) {
    if (window.PointerEvent) {
      return;
    }

    const transformEvent = (event) => {
      if (event instanceof MouseEvent) {
        element.dispatchEvent(new event.constructor(event.type.replace("mouse", "pointer"), event));
      } else {
        let type;
        if (event.type === "touchmove") {
          type = "pointermove";
        } else if (event.type === "touchstart") {
          type = "pointerdown";
        } else if (event.type === "touchend") {
          type = "pointerup";
        }

        const pointerEvent = new Event(type, event);

        const touch = event.touches[0];
        if (touch) {
          for (const key in touch) {
            if (key === "target") {
              continue;
            }
            pointerEvent[key] = touch[key];
          }
          pointerEvent.x = touch.clientX;
          pointerEvent.y = touch.clientY;
        }

        element.dispatchEvent(pointerEvent);
      }
    };

    element.addEventListener("mousedown", transformEvent);
    element.addEventListener("mousemove", transformEvent);
    element.addEventListener("mouseup", transformEvent);

    element.addEventListener("touchstart", transformEvent);
    element.addEventListener("touchmove", transformEvent);
    element.addEventListener("touchend", transformEvent);
  }
}
