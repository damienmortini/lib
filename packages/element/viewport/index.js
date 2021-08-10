import GestureObserver from '../core/input/GestureObserver.js'

export default class ViewportElement extends HTMLElement {
  constructor() {
    super()

    this.attachShadow({ mode: 'open' }).innerHTML = `<style>
  :host {
    display: block;
    overflow: hidden;
    touch-action: none;
    position: relative;
    width: 300px;
    height: 150px;
  }

  #container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    touch-action: none;
  }

  #container slot {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    will-change: transform;
  }

  #container slot::slotted(*) {
    pointer-events: auto;
  }
</style>
<slot></slot>
<div id="container"></div>`

    this._scale = 1

    this._elementSlotMap = new Map()
    this._slotDOMMatrixMap = new Map()

    const container = this.shadowRoot.querySelector('#container')
    this._slotUID = 0
    this._slots = new Set()

    let viewportBoundingClientRect = this.getBoundingClientRect()

    const zoomMatrix = new DOMMatrix()
    const zoom = (scale, x, y) => {
      if (scale === 1) return
      this._scale *= scale

      zoomMatrix.m11 = scale
      zoomMatrix.m22 = scale
      zoomMatrix.m41 = -x * (scale - 1)
      zoomMatrix.m42 = -y * (scale - 1)

      for (const slot of this._slots) {
        const domMatrix = this._slotDOMMatrixMap.get(slot)
        domMatrix.preMultiplySelf(zoomMatrix)
        slot.style.transform = domMatrix.toString()
      }
    }

    const offsetSlot = (slot, offsetX, offsetY) => {
      const domMatrix = this._slotDOMMatrixMap.get(slot)
      domMatrix.m41 += offsetX
      domMatrix.m42 += offsetY
      slot.style.transform = domMatrix.toString()
    }

    let isViewportInteracting = false
    new GestureObserver((gesture) => {
      if (gesture.state === 'finishing') {
        isViewportInteracting = false
        return
      }
      for (const pointer of gesture.pointers.values()) {
        isViewportInteracting = isViewportInteracting || pointer.target === this
      }
      if (!isViewportInteracting) return
      if (gesture.state === 'starting') viewportBoundingClientRect = this.getBoundingClientRect()
      zoom(gesture.movementScale, gesture.x - viewportBoundingClientRect.x - viewportBoundingClientRect.width * .5, gesture.y - viewportBoundingClientRect.y - viewportBoundingClientRect.height * .5)
      for (const slot of this._slots) {
        offsetSlot(slot, gesture.movementX, gesture.movementY)
      }
    }).observe(this)

    const elementGestureObserver = new GestureObserver((gesture) => {
      if (isViewportInteracting) return
      const target = gesture.event.target
      if (
        target.isContentEditable ||
        target instanceof HTMLInputElement && ['text', 'number', 'password', 'search', 'number', 'range', 'email', 'url', 'tel'].includes(target.type) ||
        target instanceof HTMLTextAreaElement ||
        getComputedStyle(target)['touch-action'] === 'none'
      ) return
      offsetSlot(gesture.target.assignedSlot, gesture.movementX, gesture.movementY)
    }, { pointerCapture: true })

    this.addEventListener('wheel', (event) => {
      if (event.target !== this && event.target.scrollHeight > event.target.clientHeight) {
        return
      }
      viewportBoundingClientRect = this.getBoundingClientRect()
      const scale = 1 + (event.deltaY < 0 ? 1 : -1) * .1
      const x = event.clientX - viewportBoundingClientRect.x - viewportBoundingClientRect.width * .5
      const y = event.clientY - viewportBoundingClientRect.y - viewportBoundingClientRect.height * .5
      zoom(scale, x, y)
    }, { passive: false })

    const mutationCallback = (mutationsList) => {
      for (const mutation of mutationsList) {
        for (const node of mutation.addedNodes) {
          const slot = document.createElement('slot')
          slot.name = `viewport-slot-${this._slotUID}`
          node.slot = slot.name

          const domMatrix = new DOMMatrix()
          this._slotDOMMatrixMap.set(slot, domMatrix)
          domMatrix.m11 = this._scale
          domMatrix.m22 = this._scale

          this._elementSlotMap.set(node, slot)
          container.appendChild(slot)
          this._slotUID++
          this._slots.add(slot)
          elementGestureObserver.observe(node)
        }
        for (const node of mutation.removedNodes) {
          const slot = this._elementSlotMap.get(node)
          this._elementSlotMap.delete(node)
          if (!slot) continue
          node.slot = ''
          elementGestureObserver.unobserve(node)
          this._slots.delete(slot)
          slot.remove()
        }
      }
    }
    mutationCallback([{
      addedNodes: this.children,
      removedNodes: [],
    }])
    const observer = new MutationObserver(mutationCallback)
    observer.observe(this, { childList: true })
  }
}

customElements.define('damo-viewport', ViewportElement)
