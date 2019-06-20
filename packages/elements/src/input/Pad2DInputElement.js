export default class Pad2DInputElement extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" }).innerHTML = `
      <style>
        :host {
          display: inline-block;
          position: relative;
          width: 100px;
          height: 100px;
          touch-action: none;
        }
        .pad {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: 10px 10px, 10px 10px, 50px 50px, 50px 50px;
          background-image: linear-gradient(to right, grey 0px, transparent 1px), linear-gradient(to bottom, grey 0px, transparent 1px), linear-gradient(to right, black 0px, transparent 1px), linear-gradient(to bottom, black 0px, transparent 1px);
          background-position: -.5px -.5px;
          touch-action: none;
        }
        .pointer {
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 4px;
          background: black;
          border-radius: 50%;
          margin-left: -2px;
          margin-top: -2px;
          will-change: transform;
          pointer-events: none;
        }
      </style>
      <div class="pad"></div>
      <div class="pointer"></div>
    `;

    this._pad = this.shadowRoot.querySelector(".pad");
    this._pointer = this.shadowRoot.querySelector(".pointer");

    const pointerDownPosition = [0, 0];
    const pointerDownScreenPosition = [0, 0];

    const updatePointer = (event) => {
      event.preventDefault();
      let x = ((pointerDownPosition[0] + event.screenX - pointerDownScreenPosition[0]) / this._pad.offsetWidth) * 2 - 1;
      let y = ((pointerDownPosition[1] + event.screenY - pointerDownScreenPosition[1]) / this._pad.offsetHeight) * 2 - 1;
      x = Math.max(Math.min(1, x), -1);
      y = Math.max(Math.min(1, y), -1);
      this.value = [x, y];
      this.dispatchEvent(new Event("input"));
    };

    const onPointerUp = (event) => {
      updatePointer(event);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", updatePointer);
      this.dispatchEvent(new Event("change"));
    };

    this._pad.addEventListener("pointerdown", (event) => {
      pointerDownPosition[0] = event.offsetX;
      pointerDownPosition[1] = event.offsetY;
      pointerDownScreenPosition[0] = event.screenX;
      pointerDownScreenPosition[1] = event.screenY;
      window.addEventListener("pointermove", updatePointer);
      window.addEventListener("pointerup", onPointerUp);
    });

    this.value = [0, 0];
  }

  get value() {
    return this._value;
  }

  set value(value) {
    this._value = value;
    this._pointer.style.transform = `translate(${(this._value[0] * .5 + .5) * this._pad.offsetWidth}px, ${(this._value[1] * .5 + .5) * this._pad.offsetHeight}px)`;
  }
}
