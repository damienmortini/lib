export default class DragHandler extends Set {
  constructor({
    elements = [],
    exceptions = [],
  } = {}) {
    super();

    this.exceptions = exceptions;

    this.selected = new Set();

    this._onPointerDownBinded = this._onPointerDown.bind(this);
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

    this._animationFrameID = -1;

    this._elementTransformMatrices = new Map();

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
    this._previousClientX = event.clientX;
    this._previousClientY = event.clientY;
    this._clientX = event.clientX;
    this._clientY = event.clientY;
    this._dragStartX = event.clientX;
    this._dragStartY = event.clientY;
    this.selected.add(event.currentTarget);
    for (const element of this.selected) {
      this._elementTransformMatrices.set(element, new DOMMatrix(element.style.transform));
    }
    window.addEventListener('pointermove', this._onPointerMoveBinded, { passive: false });
    window.addEventListener('pointerup', this._onPointerUpBinded, { passive: false });
    this._update();
  }

  _onPointerMove(event) {
    for (const element of this.selected) {
      element.style.pointerEvents = 'none';
    }
    this._clientX = event.clientX;
    this._clientY = event.clientY;
  }

  _onPointerUp() {
    cancelAnimationFrame(this._animationFrameID);
    window.removeEventListener('pointermove', this._onPointerMoveBinded);
    window.removeEventListener('pointerup', this._onPointerUpBinded);
    for (const element of this.selected) {
      element.style.pointerEvents = '';
    }
    this._preventDrag = false;
    this.selected.clear();
  }

  _update() {
    if (this._preventDrag) {
      this._onPointerUp();
      return;
    }
    this._animationFrameID = requestAnimationFrame(this._updateBinded);
    if (Math.abs(this._clientX - this._dragStartX) < 2 || Math.abs(this._clientY - this._dragStartY) < 2) {
      return;
    }
    for (const element of this.selected) {
      const domMatrix = this._elementTransformMatrices.get(element);
      domMatrix.translateSelf(this._clientX - this._previousClientX, this._clientY - this._previousClientY);
      element.style.transform = domMatrix.toString();
    }
    this._previousClientX = this._clientX;
    this._previousClientY = this._clientY;
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
