export default class InputPadXYElement extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'disabled']
  }

  constructor() {
    super()

    this._value = [0, 0]

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: inline-block;
          position: relative;
          width: 100px;
          height: 100px;
          touch-action: none;
          background: white;
          overflow: hidden;
          contain: content;
        }

        :host([disabled]) {
          opacity: .5;
        }

        .pad {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          cursor: crosshair;
          background-size: 10% 10%, 10% 10%, 50% 50%, 50% 50%;
          background-image: linear-gradient(to right, grey 0px, transparent 1px), linear-gradient(to bottom, grey 0px, transparent 1px), linear-gradient(to right, black 0px, transparent 1px), linear-gradient(to bottom, black 0px, transparent 1px);
          background-position: -.5px -.5px;
          touch-action: none;
        }
        .pointer {
          position: absolute;
          top: 50%;
          left: 50%;
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
    `

    this._pad = this.shadowRoot.querySelector('.pad')
    this._pointer = this.shadowRoot.querySelector('.pointer')

    const resizeObserver = new ResizeObserver((entries) => {
      this._width = entries[0].contentRect.width
      this._height = entries[0].contentRect.height

      this._updatePointer()
    })
    resizeObserver.observe(this)

    const pointerDownPosition = [0, 0]
    const pointerDownScreenPosition = [0, 0]

    const updatePointer = (event) => {
      event.preventDefault()
      let x = ((pointerDownPosition[0] + event.screenX - pointerDownScreenPosition[0]) / this._pad.offsetWidth) * 2 - 1
      let y = -(((pointerDownPosition[1] + event.screenY - pointerDownScreenPosition[1]) / this._pad.offsetHeight) * 2 - 1)
      x = Math.max(Math.min(1, x), -1)
      y = Math.max(Math.min(1, y), -1)
      this.value = [x, y]
    }

    const onPointerUp = (event) => {
      updatePointer(event)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointermove', updatePointer)
    }

    this._pad.addEventListener('pointerdown', (event) => {
      pointerDownPosition[0] = event.offsetX
      pointerDownPosition[1] = event.offsetY
      pointerDownScreenPosition[0] = event.screenX
      pointerDownScreenPosition[1] = event.screenY
      window.addEventListener('pointermove', updatePointer)
      window.addEventListener('pointerup', onPointerUp)
    })
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'value':
        this.value = new Function(`return ${newValue}`).apply(this)
        break
    }
  }

  get disabled() {
    return this.hasAttribute('disabled')
  }

  set disabled(value) {
    if (value) {
      this.setAttribute('disabled', '')
    } else {
      this.removeAttribute('disabled')
    }
  }

  _updatePointer() {
    this._pointer.style.transform = `translate(${this._value[0] * this._width * .5}px, ${-this._value[1] * this._height * .5}px)`
  }

  get value() {
    return this._value
  }

  set value(value) {
    if (this._value[0] === value[0] && this._value[1] === value[1]) {
      return
    }
    this._value = value
    this._updatePointer()
    this.dispatchEvent(new Event('input', {
      bubbles: true,
    }))
    this.dispatchEvent(new Event('change', {
      bubbles: true,
    }))
  }
}

if (!customElements.get('damo-input-pad-xy')) {
  customElements.define('damo-input-pad-xy', class DamoInputPadXYElement extends InputPadXYElement { })
}
