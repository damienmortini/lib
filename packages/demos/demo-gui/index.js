
import '../../@damienmortini/damdom-gui/index.js'

export class DemoGuiElement extends HTMLElement {
  constructor() {
    super()

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
        }
      </style>
      <damdom-gui></damdom-gui>
    `

    const gui = this.shadowRoot.querySelector('damdom-gui')

    gui.add({
      label: 'Boolean',
      value: false,
    })

    gui.add({
      label: 'Number',
      value: 3,
      max: 10,
      min: -10,
      step: 0.25,
    })

    gui.add({
      label: 'Text',
      value: 'Hi world !',
    })

    gui.add({
      label: 'Color',
      value: '#ffff00',
    })

    gui.add({
      label: 'Select',
      value: 'Cat',
      options: ['Cat', 'Dog', 'Mouse'],
    })
  }
}

window.customElements.define('demo-gui', DemoGuiElement)
