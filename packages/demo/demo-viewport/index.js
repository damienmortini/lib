import '@damienmortini/damdom-viewport/index.js';

export class DemoViewportElement extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: grid;
          position: relative;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          width: 100%;
          height: 100%;
        }

        damdom-viewport {
          width: 100%;
          height: 100%;
        }

        damdom-viewport div[selected] {
          box-shadow: 0 0 0 1px black;
        }
      </style>
      <damdom-viewport>
      <div style="position: absolute; background-color: blue; width: 100px; height: 100px;"></div>
    </damdom-viewport>
    <damdom-viewport>
      <div style="position: absolute; background-color: red; width: 100px; height: 100px; left: 50%;"></div>
      <div
        style="position: absolute; background-color: green; width: 100px; height: 100px; border-radius: 50%; top: 25px; left: 100px;">
      </div>
    </damdom-viewport>
    <damdom-viewport>
      <div
        style="position: absolute; background-color: yellow; padding: 40px; top: 50px; left: 50%; display: grid; box-sizing: border-box;">
        <input type="range">
        <input type="range">
        <input type="range">
        <input type="range">
      </div>
      <div
        style="position: absolute; background-color: cyan; padding: 40px; top: 100px; left: 100px; display: grid; box-sizing: border-box;">
        <input type="range">
        <input type="range">
        <input type="range">
        <input type="range">
      </div>
      <div style="position: absolute; background-color: red; width: 100px; height: 100px; left: 50px;"></div>
    </damdom-viewport>
    <damdom-viewport>
      <div style="position: absolute; resize: both; overflow: hidden; background-color: red; width: 100px; height: 100px; left: 250px;">
      </div>
      <div
        style="position: absolute; background-color: green; width: 100px; height: 100px; border-radius: 50%; top: 25px; left: 100px;">
      </div>
      <div style="position: absolute; padding: 40px; background-color: blueviolet; top: 40%; left: 40%;">
        <textarea style="width: 200px; height: 100px;"></textarea>
      </div>
    </damdom-viewport>
    `;
  }
}

window.customElements.define('demo-viewport', DemoViewportElement);
