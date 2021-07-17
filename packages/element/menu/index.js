export default class MenuElement extends HTMLElement {
  constructor() {
    super()

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: inline-block;
          padding: 5px 0;
        }

        ul {
          padding: 0;
          margin: 0;
        }

        li {
          display: block;
          padding: 5px 30px;
          user-select: none;
        }

        li:hover {
          background: rgba(0, 0, 0, .1);
        }
      </style>
      <div></div>
    `

    this._container = this.shadowRoot.querySelector('div')
  }

  get options() {
    return this._options
  }

  set options(value) {
    this._options = value
    this._container.innerHTML = ''
    const addOptionsTo = (options, container) => {
      const ul = document.createElement('ul')
      container.appendChild(ul)
      for (const option of options) {
        const li = document.createElement('li')
        if (option.options) {
          addOptionsTo(option.options, li)
          delete option.options
        }
        for (const [key, value] of Object.entries(option)) {
          li[key] = value
        }
        ul.appendChild(li)
      }
    }
    addOptionsTo(this._options, this._container)
  }
}

customElements.define('damo-menu', MenuElement)
