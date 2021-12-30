import { getGraph } from '../../@damienmortini/graph/index.js'

export class GraphGUIElement extends HTMLElement {
  #rtcPeerConnection
  #dataChannel

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
      </style>
      <slot>GUI</slot>
    `
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'name') {
      this.#dataChannel?.close()
      this.#rtcPeerConnection?.close()
      const graph = getGraph(this.getAttribute(newValue))
      if (graph) {
        this.#rtcPeerConnection = new RTCPeerConnection()
        this.#rtcPeerConnection.ondatachannel = (event) => {
          this.#dataChannel = event.channel
          this.#dataChannel.onmessage = (event) => console.log(event.data)
          this.#dataChannel.send('Hi back!')
        }
        graph.connect(this.#rtcPeerConnection)
      }
    }
  }
}

window.customElements.define('graph-gui', GraphGUIElement)
