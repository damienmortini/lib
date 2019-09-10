export default class DraggableElement extends HTMLElement {
  static get observedAttributes() {
    return ["targets", "handles", "disabled"];
  }

  constructor() {
    super();

    this.attachShadow({ mode: "open" }).innerHTML = `
      <slot></slot>
    `;

    this.dragFactor = 1;

    this._currentDragFactor = 0;

    this._disabled = false;

    this._handles = [this];
    this._targets = [this];

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
      case "targets":
      case "handles":
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
    for (const handle of this.handles) {
      handle.removeEventListener("pointerdown", this._onPointerDownBinded);
    }
    for (const target of this.targets) {
      target.removeEventListener("dragstart", this._preventDefaultBinded);
    }
  }

  get targets() {
    return this._targets;
  }

  set targets(value) {
    this.disconnectedCallback();
    this._targets = value;
    this.disabled = this.disabled;
  }

  get handles() {
    return this._handles;
  }

  set handles(value) {
    this.disconnectedCallback();
    this._handles = value;
    this.disabled = this.disabled;
  }

  get disabled() {
    return this._disabled;
  }

  set disabled(value) {
    this._disabled = value;

    this.disconnectedCallback();

    if (!this._disabled) {
      for (const handle of this.handles) {
        handle.addEventListener("pointerdown", this._onPointerDownBinded);
      }
      for (const target of this.targets) {
        target.addEventListener("dragstart", this._preventDefaultBinded);
      }
    }

    this.setAttribute("disabled", this._disabled);
  }

  _preventDefault(event) {
    event.preventDefault();
  }

  _onPointerDown(event) {
    console.log("dkshfdskj");
    
    if (!this.handles.includes(event.target)) {
      return;
    }

    event.stopPropagation();

    this._currentDragFactor = this.dragFactor;

    for (const element of event.path) {
      if (element instanceof DraggableElement) {
        this._currentDragFactor *= element.dragFactor;
      }
    }

    this._dragStartX = event.clientX * this._currentDragFactor;
    this._dragStartY = event.clientY * this._currentDragFactor;
    this._offsetX = this._targets[0].offsetLeft;
    this._offsetY = this._targets[0].offsetTop;

    window.addEventListener("pointermove", this._onPointerMoveBinded, { passive: false });
    window.addEventListener("pointerup", this._onPointerUpBinded);
    window.addEventListener("touchmove", this._preventDefaultBinded, { passive: false });
  }

  _onPointerMove(event) {
    for (const target of this.targets) {
      target.style.transform = `translate(${event.clientX * this._currentDragFactor - this._dragStartX}px, ${event.clientY * this._currentDragFactor - this._dragStartY}px)`;
    }
  }

  _onPointerUp(event) {
    window.removeEventListener("pointermove", this._onPointerMoveBinded);
    window.removeEventListener("pointerup", this._onPointerUpBinded);
    window.removeEventListener("touchmove", this._preventDefaultBinded);
    for (const target of this.targets) {
      target.style.left = `${this._offsetX + event.clientX * this._currentDragFactor - this._dragStartX}px`;
      target.style.top = `${this._offsetY + event.clientY * this._currentDragFactor - this._dragStartY}px`;
      target.style.transform = "";
    }
  }
}
