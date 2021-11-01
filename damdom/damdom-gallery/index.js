class DamdomGalleryElement extends HTMLElement {
  #highlightedIndex = -1
  #highlight
  #grid

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

    this.#highlight = this.shadowRoot.querySelector('#highlight')
    this.#grid = this.shadowRoot.querySelector('#grid')
    const backButton = this.shadowRoot.querySelector('#backbutton')

    const highlightButtonClick = (event) => {
      this.highlightedIndex = Number(event.target.parentElement.id)
    }

    const backButtonClick = () => {
      this.highlightedIndex = -1
    }

    backButton.addEventListener('click', backButtonClick)

    let slotUID = 0
    const nodeContainerMap = new Map()
    const mutationCallback = (mutationsList) => {
      for (const mutation of mutationsList) {
        for (const node of mutation.addedNodes) {
          const container = document.createElement('div')
          container.part = 'item'
          container.classList.add('elementcontainer')
          container.id = slotUID
          container.innerHTML = `
            <slot name="element${slotUID}"></slot>
            <div class="highlightbutton"></div>
          `
          container.querySelector('.highlightbutton').addEventListener('click', highlightButtonClick)
          node.slot = `element${slotUID}`
          this.#grid.appendChild(container)
          nodeContainerMap.set(node, container)
          slotUID++
        }
        for (const node of mutation.removedNodes) {
          node.slot = ''
          const container = nodeContainerMap.get(node)
          container.querySelector('.highlightbutton').removeEventListener('click', highlightButtonClick)
          container.remove()
          nodeContainerMap.delete(node)
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

  get highlightedIndex() {
    return this.#highlightedIndex
  }

  set highlightedIndex(value) {
    const element = this.querySelector(`[slot=element${value}]`)
    if (!element) value = -1
    if (value === this.#highlightedIndex) return
    if (value !== -1) {
      element.slot = 'highlight'
      element.toggleAttribute('highlighted', true)
      this.#highlight.classList.remove('hide')
      this.#grid.classList.add('hide')
    } else {
      this.#highlight.classList.add('hide')
      this.#grid.classList.remove('hide')
      const highlightedElement = this.querySelector(`[slot=highlight]`)
      if (!highlightedElement) return
      highlightedElement.slot = `element${this.#highlightedIndex}`
      highlightedElement.toggleAttribute('highlighted', false)
    }
    this.#highlightedIndex = value
    this.dispatchEvent(new Event('highlightchange'))
  }
}

window.customElements.define('damdom-gallery', DamdomGalleryElement)
