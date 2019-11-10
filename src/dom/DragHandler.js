export default class DragHandler {
  constructor({
    elements = [],
    exceptions = [],
  } = {}) {
    this.exceptions = exceptions;

    this._draggedElements = null;

    this._onPointerMoveBinded = this._onPointerMove.bind(this);
    this._onPointerUpBinded = this._onPointerUp.bind(this);
    this._updateBinded = this._update.bind(this);

    this._previousClientX = 0;
    this._previousClientY = 0;

    this._clientX = 0;
    this._clientY = 0;

    this._dragStartX = 0;
    this._dragStartY = 0;

    this._preventDrag = false;
    this._dragInitialized = false;

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
    this._dragInitialized = false;
    window.addEventListener('pointermove', this._onPointerMoveBinded, { passive: false });
    window.addEventListener('pointerup', this._onPointerUpBinded, { passive: false });
  }

  _onPointerMove(event) {
    if (!this._dragInitialized) {
      this._previousClientX = event.clientX;
      this._previousClientY = event.clientY;
      this._clientX = event.clientX;
      this._clientY = event.clientY;
      this._dragStartX = event.clientX;
      this._dragStartY = event.clientY;
      this._resizedOnceElements.clear();
      this._preventDrag = false;
      for (const element of this._draggedElements) {
        this._elementTransformMatrices.set(element, new DOMMatrix(element.style.transform));
        this._resizeObserver.observe(element);
      }
      this._dragInitialized = true;
      this._update();
    }
    this._clientX = event.clientX;
    this._clientY = event.clientY;
  }

  _onPointerUp() {
    cancelAnimationFrame(this._animationFrameID);
    window.removeEventListener('pointermove', this._onPointerMoveBinded);
    window.removeEventListener('pointerup', this._onPointerUpBinded);
    this._resizeObserver.disconnect();
    for (const element of this._draggedElements) {
      element.style.pointerEvents = '';
    }
    this._dragInitialized = false;
    this._preventDrag = false;
    this._draggedElements = null;
  }

  _update() {
    if (this._preventDrag) {
      this._onPointerUp();
      return;
    }
    this._animationFrameID = requestAnimationFrame(this._updateBinded);
    if (Math.abs(this._clientX - this._dragStartX) < 2 && Math.abs(this._clientY - this._dragStartY) < 2) {
      return;
    }
    for (const element of this._draggedElements) {
      element.style.pointerEvents = 'none';
      const domMatrix = this._elementTransformMatrices.get(element);
      domMatrix.m41 += this._clientX - this._previousClientX;
      domMatrix.m42 += this._clientY - this._previousClientY;
      element.style.transform = domMatrix.toString();
    }
    this._previousClientX = this._clientX;
    this._previousClientY = this._clientY;
  }
}
