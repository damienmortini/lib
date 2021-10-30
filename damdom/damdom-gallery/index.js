class DamdomGalleryElement extends HTMLElement {
  constructor() {
    super()

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: grid;
          position: relative;
          grid-gap: 10px;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          grid-auto-rows: minmax(300px, 1fr);
          grid-auto-flow: row dense;
          justify-items: center;
          align-items: center;
        }

        #grid {
          display: contents;
        }

        #highlight {
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
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

        .highlightbutton {
          position: absolute;
          right: 20px;
          bottom: 20px;
          width: 20px;
          height: 20px;
          background-image: url(node_modules/@damienmortini/damdom-gallery/icon-fullscreen.svg);
          mix-blend-mode: exclusion;
          cursor: pointer;
        }
      </style>
      <slot id="highlight" name="highlight" class="hide"></slot>
      <div id="grid"></div>
    `

    const highlight = this.shadowRoot.querySelector('#highlight')
    const grid = this.shadowRoot.querySelector('#grid')

    let currentId = null

    const enterHighlight = (event) => {
      if (event.target.classList.contains('highlightbutton')) {
        currentId = event.target.parentElement.id
        const element = this.querySelector(`[slot=${currentId}]`)
        element.slot = 'highlight'
        element.toggleAttribute('highlighted', true)
        highlight.classList.remove('hide')
        grid.classList.add('hide')
      }
    }

    const leaveHighlight = (event) => {
      highlight.classList.add('hide')
      grid.classList.remove('hide')
      const element = this.querySelector(`[slot=highlight]`)
      element.slot = currentId
      element.toggleAttribute('highlighted', false)
      currentId = null
    }

    // TMP
    highlight.addEventListener('click', leaveHighlight)

    let slotUID = 0
    const nodeContainerMap = new Map()
    const mutationCallback = (mutationsList) => {
      for (const mutation of mutationsList) {
        for (const node of mutation.addedNodes) {
          const container = document.createElement('div')
          container.classList.add('elementcontainer')
          const id = `damdom-gallery-element${slotUID}`
          container.id = id
          container.innerHTML = `
            <slot name="${id}"></slot>
            <div class="highlightbutton"></div>
          `
          container.addEventListener('click', enterHighlight)
          node.slot = id
          grid.appendChild(container)
          nodeContainerMap.set(node, container)
          slotUID++
        }
        for (const node of mutation.removedNodes) {
          node.slot = ''
          const container = nodeContainerMap.get(node)
          container.removeEventListener('click', enterHighlight)
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
}

window.customElements.define('damdom-gallery', DamdomGalleryElement)
