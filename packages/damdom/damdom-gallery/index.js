class DamdomGalleryElement extends HTMLElement {
  #highlightContainer
  #gridContainer
  #highlighted = null
  #elementSlotMap

  constructor() {
    super()

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          width: 300px;
          height: 300px;
          font-family: sans-serif;
        }
        
        #grid {
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          grid-auto-rows: minmax(300px, 1fr);
          grid-auto-flow: row dense;
          overflow: auto;
          box-sizing: border-box;
          padding: 10px;
          gap: 10px;
          justify-items: center;
          align-items: center;
        }

        #highlight {
          display: grid;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          justify-items: center;
          align-items: center;
        }

        #highlight.hide, #grid.hide {
          display: none;
        }

        .elementcontainer {
          display: grid;
          position: relative;
          background: white;
          width: 100%;
          height: 100%;
          justify-items: center;
          align-items: center;
        }

        .highlightbutton, #backbutton {
          position: absolute;
          right: 15px;
          bottom: 15px;
          width: 30px;
          height: 30px;
          border-radius: 5px;
          box-shadow: 0px 0px 5px 0px rgb(0 0 0 / 10%);
          background-color: white;
          background-size: 55%;
          background-repeat: no-repeat;
          background-position: center;
          cursor: pointer;
          will-change: transform;
          transition: transform .4s cubic-bezier(0.6, 2, 0.5, 1);
        }

        .highlightbutton:hover, #backbutton:hover {
          transform: scale(1.1);
        }
        
        .highlightbutton {
          background-image: url(node_modules/@damienmortini/damdom-gallery/icon-expand.svg);
        }
        
        #backbutton {
          background-image: url(node_modules/@damienmortini/damdom-gallery/icon-compress.svg);
        }
      </style>
      <div id="highlight" class="hide">
        <slot name="highlight"></slot>
        <div id="backbutton"></div>
      </div>
      <div id="grid" part="grid"></div>
    `

    this.#highlightContainer = this.shadowRoot.querySelector('#highlight')
    this.#gridContainer = this.shadowRoot.querySelector('#grid')
    const backButton = this.shadowRoot.querySelector('#backbutton')

    const highlightButtonClick = (event) => {
      for (const [element, id] of this.#elementSlotMap) {
        if (id === event.target.parentElement.id) {
          this.highlighted = element
        }
      }
    }

    const backButtonClick = () => {
      this.highlighted = null
    }

    backButton.addEventListener('click', backButtonClick)

    let slotUID = 0
    this.#elementSlotMap = new Map()
    const mutationCallback = (mutationsList) => {
      for (const mutation of mutationsList) {
        for (const node of mutation.addedNodes) {
          const slotName = `gallery-item-${slotUID++}`
          const container = document.createElement('div')
          container.part = 'item'
          container.classList.add('elementcontainer')
          container.id = slotName
          container.innerHTML = `
            <slot name="${slotName}"></slot>
            <div class="highlightbutton"></div>
          `
          container.querySelector('.highlightbutton').addEventListener('click', highlightButtonClick)
          node.slot = slotName
          this.#elementSlotMap.set(node, slotName)
          this.#gridContainer.appendChild(container)
        }
        for (const node of mutation.removedNodes) {
          node.slot = ''
          const container = this.#gridContainer.querySelector(`#${this.#elementSlotMap.get(node)}`)
          container.querySelector('.highlightbutton').removeEventListener('click', highlightButtonClick)
          container.remove()
          this.#elementSlotMap.delete(node)
        }
      }
    }
    mutationCallback([{
      addedNodes: this.children,
      removedNodes: [],
    }])
    const observer = new MutationObserver(mutationCallback)
    observer.observe(this, { childList: true })
  }

  get highlighted() {
    return this.#highlighted
  }

  set highlighted(value) {
    if (this.#highlighted === value) return
    if (this.#highlighted) {
      this.#highlighted.slot = `${this.#elementSlotMap.get(this.#highlighted)}`
      this.#highlighted.toggleAttribute('highlighted', false)
    }
    this.#highlighted = value
    if (this.#highlighted) {
      this.#highlighted.slot = 'highlight'
      this.#highlighted.toggleAttribute('highlighted', true)
      this.#highlightContainer.classList.remove('hide')
      this.#gridContainer.classList.add('hide')
    } else {
      this.#highlightContainer.classList.add('hide')
      this.#gridContainer.classList.remove('hide')
    }
    this.dispatchEvent(new Event('highlightchange'))
  }
}

window.customElements.define('damdom-gallery', DamdomGalleryElement)
