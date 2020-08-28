import fs from 'fs-extra';

/**
 * @param {String} cloned Cloned element
 * @param {String} name Element name
 */
export default function (cloned, name) {
  fs.outputFileSync(`./packages/${name}/index.js`, `window.customElements.define('${name}', class extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = \`
      <style>
        :host {
          display: block;
          position: relative;
          contain: content;
        }
      </style>
      <slot></slot>
    \`;
  }
});
`);
  fs.outputFileSync(`./packages/${name}/package.json`, JSON.stringify({
    name: `@damienmortini/${name}`,
    private: true,
    version: '0.0.1',
  }, null, 2));
};
