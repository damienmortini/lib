import { getGraph } from '../../@damienmortini/graph/index.js'
import '../../@damienmortini/damdom-viewport/index.js'
import '../../@damienmortini/graph-propertynode/index.js'

export class GraphGUIElement extends HTMLElement {
  #graph
  #container

  static get observedAttributes() {
    return ['name']
  }

  constructor() {
    super()

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
        }

        damdom-viewport {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
      </style>
      <damdom-viewport id="container"></damdom-viewport>
    `

    this.#container = this.shadowRoot.querySelector('#container')
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'name') {
      this.#graph?.onChange.delete(this.#onGraphChange)
      this.#graph = getGraph(newValue)
      this.#graph.onChange.add(this.#onGraphChange)
      this.#onGraphChange({
        type: 'content',
        data: this.#graph.content,
      })
    }
  }

  #onGraphChange = ({ type, data }) => {
    if (type === 'content') {
      this.#container.innerHTML = data
    } else if (type === 'data') {
      let node = this.querySelector(`#${data.id}`)
      if (!node) {
        node = document.createElement('graph-propertynode')
        node.id = data.id
        this.#container.appendChild(node)
      }
      node.value = data.value
      console.log(data)
    }
  }
}

window.customElements.define('graph-gui', GraphGUIElement)
