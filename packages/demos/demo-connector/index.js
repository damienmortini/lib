import css from './index.css' assert { type: 'css' }
import '@damienmortini/damdom-connector/index.js'

export class DemoConnectorElement extends HTMLElement {
  constructor() {
    super()

    this.attachShadow({ mode: 'open' })
    this.shadowRoot.adoptedStyleSheets = [css]
    this.shadowRoot.innerHTML = `
      <div id="left">
        <input type="range" id="input">
        <damdom-connector tabindex="-1" id="input-connector" input="input" output="output-connector"></damdom-connector>
      </div>
      <div id="right">
        <damdom-connector tabindex="-1" id="output-connector" output="output"></damdom-connector>
        <input type="range" id="output">
      </div>
    `

    this.shadowRoot.querySelector('#input').addEventListener('input', (event) => event.target.dispatchEvent(new Event('change')))

    let activeConnector
    this.shadowRoot.addEventListener('pointerdown', (event) => {
      if (event.target.localName !== 'damdom-connector') return
      if (activeConnector === event.target) {
        activeConnector.disconnectConnectors()
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
  }
}

customElements.define('demo-connector', DemoConnectorElement)
