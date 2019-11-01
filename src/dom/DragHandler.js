export default class DragHandler extends Set {
  constructor({
    elements = [],
    exceptions = [],
  } = {}) {
    super();

    this.exceptions = exceptions;

    this._onPointerDownBinded = this._onPointerDown.bind(this);
    this._onPointerMoveBinded = this._onPointerMove.bind(this);
    this._onPointerUpBinded = this._onPointerUp.bind(this);
    this._updateBinded = this._update.bind(this);

    this._dragStartX = 0;
    this._dragStartY = 0;

    this._dragX = 0;
    this._dragY = 0;

    this._preventDrag = false;

    this._animationFrameID = -1;

    this.selected = new Set();
    this._elementBoundingClientRects = new Map();

    this._resizeObserver = new ResizeObserver((entries) => {
      this._preventDrag = true;
    });

    for (const element of elements) {
      this.add(element);
    }
  }

  _onPointerDown(event) {
    const composed = event.composedPath();
    for (const node of composed) {
      for (const exception of this.exceptions) {
        if (exception(node)) {
          return;
        }
      }
    }
    this._preventDrag = false;
    this._dragStartX = event.clientX;
    this._dragStartY = event.clientY;
    this._dragX = event.clientX;
    this._dragY = event.clientY;
    this.selected.add(event.currentTarget);
    for (const element of this.selected) {
      this._elementBoundingClientRects.set(element, element.getBoundingClientRect());
    }
    window.addEventListener('pointermove', this._onPointerMoveBinded, { passive: false });
    window.addEventListener('pointerup', this._onPointerUpBinded, { passive: false });
    this._update();
  }

  _onPointerMove(event) {
    if (this._preventDrag) {
      window.removeEventListener('pointermove', this._onPointerMoveBinded);
      for (const element of this.selected) {
        element.style.transform = '';
        element.style.pointerEvents = '';
      }
      return;
    }
    if (Math.abs(event.clientX - this._dragStartX) < 2 || Math.abs(event.clientY - this._dragStartY) < 2) {
      return;
    }
    for (const element of this.selected) {
      element.style.pointerEvents = 'none';
    }
    this._dragX = event.clientX;
    this._dragY = event.clientY;
  }

  _onPointerUp(event) {
    cancelAnimationFrame(this._animationFrameID);
    window.removeEventListener('pointermove', this._onPointerMoveBinded);
    window.removeEventListener('pointerup', this._onPointerUpBinded);
    for (const element of this.selected) {
      const boundingClientRect = this._elementBoundingClientRects.get(element);
      if (!this._preventDrag) {
        element.style.left = `${boundingClientRect.left + event.clientX - this._dragStartX}px`;
        element.style.top = `${boundingClientRect.top + event.clientY - this._dragStartY}px`;
      }
      element.style.transform = '';
      element.style.pointerEvents = '';
    }
    this._preventDrag = false;
    this.selected.clear();
  }

  _update() {
    this._animationFrameID = requestAnimationFrame(this._updateBinded);
    for (const element of this.selected) {
      element.style.transform = `translate(${this._dragX - this._dragStartX}px, ${this._dragY - this._dragStartY}px)`;
    }
  }

  add(element) {
    element.addEventListener('pointerdown', this._onPointerDownBinded, { passive: false });
    this._resizeObserver.observe(element);
    return super.add(element);
  }

  clear() {
    for (const element of this) {
      this.delete(element);
    }
  }

  delete(element) {
    element.removeEventListener('pointerdown', this._onPointerDownBinded);
    this._resizeObserver.unobserve(element);
    return super.delete(element);
  }
}
