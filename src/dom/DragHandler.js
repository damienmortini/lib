export default class DragHandler {
  constructor({
    elements = [],
    exceptions = [],
  } = {}) {
    this.exceptions = exceptions;

    this._draggedElements = null;

    this._pointerMap = new Map();

    this._onPointerDownBinded = this._onPointerDown.bind(this);
    this._onPointerMoveBinded = this._onPointerMove.bind(this);
    this._onPointerUpBinded = this._onPointerUp.bind(this);
    this._updateBinded = this._update.bind(this);

    this._previousClientX = 0;
    this._previousClientY = 0;

    this._dragStartX = 0;
    this._dragStartY = 0;

    this._preventDrag = false;
    this._dragging = false;

    this._animationFrameID = -1;

    this._elementTransformMatrices = new Map();

    /**
     * Fix for ResizeObserver first time calling issue
     */
    this._resizedOnceElements = new Set();
    this._resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (this._resizedOnceElements.has(entry.target)) {
          this._preventDrag = true;
        } else {
          this._resizedOnceElements.add(entry.target);
        }
      }
    });
  }

  drag(elements) {
    if (!(elements instanceof Array)) {
      elements = [elements];
    }
    this._draggedElements = elements;
    this._dragging = false;
    window.addEventListener('pointerdown', this._onPointerDownBinded, { passive: false });
    window.addEventListener('pointermove', this._onPointerMoveBinded, { passive: false });
    window.addEventListener('pointerup', this._onPointerUpBinded, { passive: false });
    cancelAnimationFrame(this._animationFrameID);
    this._update();
  }

  _onPointerDown(event) {
    this._pointerMap.set(event.pointerId, event);
    this._dragging = false;
  }

  _onPointerMove(event) {
    this._pointerMap.set(event.pointerId, event);
  }

  get dragging() {
    return this._dragging;
  }

  _onPointerUp(event) {
    this._pointerMap.delete(event.pointerId);
    if (!this._pointerMap.size) {
      this._stop();
    } else {
      this._dragging = false;
    }
  }

  _stop() {
    cancelAnimationFrame(this._animationFrameID);
    window.removeEventListener('pointerdown', this._onPointerDownBinded);
    window.removeEventListener('pointermove', this._onPointerMoveBinded);
    window.removeEventListener('pointerup', this._onPointerUpBinded);
    this._resizeObserver.disconnect();
    for (const element of this._draggedElements) {
      element.style.pointerEvents = '';
    }
    this._dragging = false;
    this._preventDrag = false;
    this._draggedElements = null;
  }

  _update() {
    if (this._preventDrag) {
      this._stop();
      return;
    }

    this._animationFrameID = requestAnimationFrame(this._updateBinded);

    if (!this._pointerMap.size) {
      return;
    }

    let clientX = 0;
    let clientY = 0;
    for (const pointer of this._pointerMap.values()) {
      clientX += pointer.clientX;
      clientY += pointer.clientY;
    }
    clientX /= this._pointerMap.size;
    clientY /= this._pointerMap.size;

    if (!this._dragging) {
      this._previousClientX = clientX;
      this._previousClientY = clientY;
      this._dragStartX = clientX;
      this._dragStartY = clientY;
      this._resizedOnceElements.clear();
      this._preventDrag = false;
      for (const element of this._draggedElements) {
        this._elementTransformMatrices.set(element, new DOMMatrix(element.style.transform));
        this._resizeObserver.observe(element);
      }
      this._dragging = true;
    }

    if (Math.abs(clientX - this._dragStartX) < 2 && Math.abs(clientY - this._dragStartY) < 2) {
      return;
    }

    for (const element of this._draggedElements) {
      element.style.pointerEvents = 'none';
      const domMatrix = this._elementTransformMatrices.get(element);
      domMatrix.m41 += clientX - this._previousClientX;
      domMatrix.m42 += clientY - this._previousClientY;
      element.style.transform = domMatrix.toString();
    }

    this._previousClientX = clientX;
    this._previousClientY = clientY;
  }
}
