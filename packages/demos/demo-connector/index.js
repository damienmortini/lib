import css from './index.css' assert { type: 'css' }
import '@damienmortini/damdom-connector/index.js'

export class DemoConnectorElement extends HTMLElement {
  constructor() {
    super()

    this.attachShadow({ mode: 'open' })
    this.shadowRoot.adoptedStyleSheets = [css]
    this.shadowRoot.innerHTML = `
      <damdom-connector id="input1"><input type="range"></damdom-connector>
      <damdom-connector id="input2" connect="input3"><input type="range"></damdom-connector>
      <damdom-connector id="input3"><input type="range"></damdom-connector>
    `
    let activeConnector
    this.shadowRoot.addEventListener('connectorselected', (event) => {
      if (activeConnector === event.target) {
        const connector = activeConnector
        requestAnimationFrame(() => connector.blur())
        activeConnector = null
      }
      if (!activeConnector) {
        activeConnector = event.target
        activeConnector.addEventListener('blur', () => activeConnector = null, { once: true })
      } else {
        const connector = activeConnector
        requestAnimationFrame(() => connector.blur())
        activeConnector.connect(event.target)
      }
    })

    // this.shadowRoot.querySelector('#input1').addEventListener('input', (event) => event.target.dispatchEvent(new Event('change')))

    // let activeConnector
    // this.shadowRoot.addEventListener('pointerdown', (event) => {
    //   if (event.target.localName !== 'damdom-connector') return
    //   if (activeConnector === event.target) {
    //     const connector = activeConnector
    //     requestAnimationFrame(() => connector.blur())
    //     activeConnector = null
    //   }
    //   if (!activeConnector) {
    //     activeConnector = event.target
    //     activeConnector.addEventListener('blur', () => activeConnector = null, { once: true })
    //   } else {
    //     const connector = activeConnector
    //     requestAnimationFrame(() => connector.blur())
    //     activeConnector.connect(event.target)
    //   }
    // })
  }
}

customElements.define('demo-connector', DemoConnectorElement)
