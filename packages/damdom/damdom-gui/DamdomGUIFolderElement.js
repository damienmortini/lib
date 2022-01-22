export default class DamdomGUIFolderElement extends HTMLElement {
  #details
  #summary
  #content

  static get observedAttributes() {
    return ['name', 'open']
  }

  constructor() {
    super()

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          font-family: sans-serif;
        }
        :host(::-webkit-scrollbar ){ 
          background: transparent;
          width: 4px;
        }
        :host(::-webkit-scrollbar-thumb) { 
          background: rgba(1, 1, 1, .1);
        }
        details {
          padding: 0 10px;
        }
        summary {
          padding: 5px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        summary:focus {
          outline: none;
        }
        #content {
          display: grid;
          align-items: center;
          grid-template-columns: auto 2fr 10px;
          gap: 5px;
        }
        section {
          display: contents;
        }
        slot::slotted(*) {
          width: 100%;
          grid-column: span 3;
        }
        section.input slot::slotted(*) {
          width: 100%;
          grid-column: span 1;
        }
        section.input label {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        section.input label:empty {
          display: none;
        }
        section.input label:empty + slot::slotted(*) {
          grid-column: span 2;
        }
        .reset {
          cursor: pointer;
          height: 100%;
          width: 100%;
          transition: opacity .4s;
        }
        .reset[disabled] {
          pointer-events: none;
          opacity: 0;
        }
        .reset svg {
          height: 100%;
          width: 100%;
        }
      </style>
      <slot></slot>
      <details>
        <summary></summary>
        <div id="content"></div>
      </details>
    `

    this.#details = this.shadowRoot.querySelector('details')
    this.#summary = this.shadowRoot.querySelector('summary')
    this.#content = this.shadowRoot.querySelector('#content')

    let slotUID = 0
    const mutationCallback = (mutationsList) => {
      for (const mutation of mutationsList) {
        for (const node of mutation.addedNodes) {
          const slotName = `node-slot-${++slotUID}`
          if (!('value' in node)) {
            const slot = document.createElement('slot')
            slot.name = slotName
            this.#content.appendChild(slot)
          } else {
            const label = node.getAttribute('label') ?? node.label ?? node.getAttribute('name') ?? node.name ?? node.id ?? ''
            const template = document.createElement('template')
            template.innerHTML = `
              <section class="input" id="${slotName}">
                <label title="${label}">${label}</label>
                <slot name="${slotName}"></slot>
                <div class="reset" disabled title="Reset">
                  <svg viewBox="0 0 10 10">
                    <line x1="1" y1="1" x2="9" y2="9" stroke-width="1.5" vector-effect="non-scaling-stroke" stroke="currentColor" stroke-linecap="round" />
                    <line x1="9" y1="1" x2="1" y2="9" stroke-width="1.5" vector-effect="non-scaling-stroke" stroke="currentColor" stroke-linecap="round" />
                  </svg>
                </div>
              </section>
            `
            const fragment = template.content.firstElementChild.cloneNode(true)
            const resetButton = fragment.querySelector('.reset')
            const defaultValue = node.value
            if (node.defaultValue !== undefined) resetButton.toggleAttribute('disabled', JSON.stringify(node.value) === JSON.stringify(node.defaultValue))
            node.addEventListener('change', () => {
              resetButton.toggleAttribute('disabled', JSON.stringify(node.value) === JSON.stringify(node.defaultValue))
            })
            resetButton.addEventListener('click', () => {
              node.value = node.defaultValue ?? defaultValue
            })
            this.#content.appendChild(fragment)
          }
          node.slot = slotName
        }
        for (const node of mutation.removedNodes) {
          const section = this.shadowRoot.querySelector(`section#${node.slot}`)
          if (section) {
            section.remove()
          }
        }
      }
    }
    mutationCallback([{
      addedNodes: this.children,
      removedNodes: [],
    }])
    const observer = new MutationObserver(mutationCallback)
    observer.observe(this, { childList: true })

    this.#details.addEventListener('toggle', (event) => {
      this.open = event.target.open
      this.dispatchEvent(new Event(event.type, event))
    })
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'name':
        this.#summary.textContent = newValue
        this.#summary.title = newValue
        break
      case 'open':
        this.#details.open = newValue !== null
        break
    }
  }

  get open() {
    return this.hasAttribute('open')
  }

  set open(value) {
    this.toggleAttribute('open', value)
  }

  get name() {
    return this.getAttribute('name')
  }

  set name(value) {
    this.setAttribute('name', value)
  }
}

customElements.define('damdom-guifolder', DamdomGUIFolderElement)
