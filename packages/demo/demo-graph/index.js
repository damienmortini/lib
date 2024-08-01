import '@damienmortini/damdom-graph/index.js';

import { getGraph } from '@damienmortini/graph/index.js';

getGraph('demo-graph').loadData('node_modules/@damienmortini/demo-graph/graph-data.json');

export class DemoGraphElement extends HTMLElement {
  #cube;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: grid;
          position: relative;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
        }
        :host(*) {
          width: 100%;
          height: 100%;
        }
        #container {
          display: grid;
          align-items: center;
          justify-items: center;
        }
        #cube {
          width: 40px;
          height: 40px;
          background-color: #f00;
        }
      </style>
      <div id="container"><div id="cube"></div></div>
      <damdom-graph name="demo-graph"></damdom-graph>
      <damdom-graph name="demo-graph"></damdom-graph>
      <damdom-graph name="demo-graph"></damdom-graph>
    `;

    this.#cube = this.shadowRoot.querySelector('#cube');
    const graph = getGraph('demo-graph');
    graph.add('cuberotation', 0, value => console.log(value));
  }
}

window.customElements.define('demo-graph', DemoGraphElement);
