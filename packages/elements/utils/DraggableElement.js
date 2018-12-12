let draggedElement;

export default class DraggableElement extends HTMLElement {
  static get observedAttributes() {
    return ["target", "handle", "disabled"];
  }

  constructor() {
    super();

    this.attachShadow({ mode: "open" }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
        }

        :host(:active) {
          cursor: grabbing;
          cursor: -webkit-grabbing;
        }
        
        slot {
          width: 20px;
          height: 20px;
          cursor: grab;
          cursor: -webkit-grab;
          width: 100%;
          height: 100%;
        }

        slot:hover {
          outline: 1px dotted;
        }
      </style>
      <slot></slot>
    `;

    this.dragFactor = 1;

    this._currentDragFactor = 0;

    this._disabled = false;

    this._handle = this;
    this._target = this;

    this._offsetX = 0;
    this._offsetY = 0;

    this._dragStartX = 0;
    this._dragStartY = 0;

    this._preventDefaultBinded = this._preventDefault.bind(this);
    this._onPointerDownBinded = this._onPointerDown.bind(this);
    this._onPointerMoveBinded = this._onPointerMove.bind(this);
    this._onPointerUpBinded = this._onPointerUp.bind(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }
    switch (name) {
      case "target":
      case "handle":
        this[name] = new Function(`return ${newValue}`).apply(this);
        break;
      case "disabled":
        this[name] = newValue === "true";
        break;
    }
  }

  connectedCallback() {
    this.disabled = this.disabled;
  }

  disconnectedCallback() {
    if (this.handle) {
      this.handle.removeEventListener("pointerdown", this._onPointerDownBinded);
    }
    if (this.target) {
      this.target.removeEventListener("dragstart", this._preventDefaultBinded);
    }
  }

  get target() {
    return this._target;
  }

  set target(value) {
    this.disconnectedCallback();
    this._target = value;
    this.disabled = this.disabled;
  }

  get handle() {
    return this._handle;
  }

  set handle(value) {
    this.disconnectedCallback();
    this._handle = value;
    this.disabled = this.disabled;
  }

  get disabled() {
    return this._disabled;
  }

  set disabled(value) {
    this._disabled = value;

    this.disconnectedCallback();

    if (!this._disabled) {
      this.handle.addEventListener("pointerdown", this._onPointerDownBinded);
      this.target.addEventListener("dragstart", this._preventDefaultBinded);
    }

    this.setAttribute("disabled", this._disabled);
  }

  _preventDefault(event) {
    event.preventDefault();
  }

  _onPointerDown(event) {
    if (draggedElement || event.button !== 0 || event.path[0].tagName === "INPUT") {
      return;
    }

    this._currentDragFactor = this.dragFactor;

    for (const element of event.path) {
      if (element instanceof DraggableElement) {
        this._currentDragFactor *= element.dragFactor;
      }
    }

    draggedElement = this;

    this._dragStartX = event.clientX * this._currentDragFactor;
    this._dragStartY = event.clientY * this._currentDragFactor;
    this._offsetX = this._target.offsetLeft;
    this._offsetY = this._target.offsetTop;

    window.addEventListener("pointermove", this._onPointerMoveBinded, { passive: false });
    window.addEventListener("pointerup", this._onPointerUpBinded);
    window.addEventListener("touchmove", this._preventDefaultBinded, { passive: false });
  }

  _onPointerMove(event) {
    this.target.style.transform = `translate(${event.clientX * this._currentDragFactor - this._dragStartX}px, ${event.clientY * this._currentDragFactor - this._dragStartY}px)`;
  }

  _onPointerUp(event) {
    window.removeEventListener("pointermove", this._onPointerMoveBinded);
    window.removeEventListener("pointerup", this._onPointerUpBinded);
    window.removeEventListener("touchmove", this._preventDefaultBinded);
    this._target.style.left = `${this._offsetX + event.clientX * this._currentDragFactor - this._dragStartX}px`;
    this._target.style.top = `${this._offsetY + event.clientY * this._currentDragFactor - this._dragStartY}px`;
    this.target.style.transform = "";

    draggedElement = null;
  }
}
