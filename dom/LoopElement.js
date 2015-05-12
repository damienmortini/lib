import CustomElement from "./CustomElement";

export default class LoopElement extends CustomElement {
  createdCallback() {
    super.createdCallback();
  }

  attachedCallback() {
    this.start();
    if(!document.hasFocus()) {
      this.stop();
    }
    window.addEventListener("blur", this);
    window.addEventListener("focus", this);
  }

  detachedCallback() {
    this.stop();
    window.removeEventListener("blur", this);
    window.removeEventListener("focus", this);
  }

  handleEvent (event) {
    switch(event.type) {
      case "focus":
        this.start();
        break;
      case "blur":
        this.stop();
        break;
    }
  }

  start() {
    this.stop();
    this.update();
  }

  stop() {
    cancelAnimationFrame(this._requestAnimationFrameId);
  }

  update() {
    this._requestAnimationFrameId = requestAnimationFrame(this.update.bind(this));
  }
}
