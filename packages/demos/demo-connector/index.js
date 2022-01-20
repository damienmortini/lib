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
        <damdom-connector id="input-connector" input="input" output="output-connector"></damdom-connector>
      </div>
      <div id="right">
        <damdom-connector id="output-connector" output="output"></damdom-connector>
        <input type="range" id="output">
      </div>
    `
  }
}

customElements.define('demo-connector', DemoConnectorElement)
