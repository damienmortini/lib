class DamdomGalleryElement extends HTMLElement {
  constructor() {
    super()

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          --gap: 10px;
          display: block;
          position: relative;
          width: 300px;
          height: 300px;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          grid-auto-rows: minmax(300px, 1fr);
          grid-auto-flow: row dense;
          font-family: sans-serif;
        }
        
        #grid {
          width: 100%;
          height: 100%;
          display: grid;
          overflow: auto;
          box-sizing: border-box;
          padding: var(--gap);
          gap: var(--gap);
          grid: inherit;
          justify-items: center;
          align-items: center;
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
          visibility: hidden;
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
      <div id="grid"></div>
    `

    const highlight = this.shadowRoot.querySelector('#highlight')
    const backButton = this.shadowRoot.querySelector('#backbutton')
    const grid = this.shadowRoot.querySelector('#grid')

    let currentId = sessionStorage.getItem('damdom-gallery:currentid')

    const highlightButtonClick = (event) => {
      enterHighlight(event.target.parentElement.id)
    }

    const enterHighlight = (id) => {
      const element = this.querySelector(`[slot=${id}]`)
      if (!element) return
      currentId = id
      sessionStorage.setItem('damdom-gallery:currentid', currentId)
      element.slot = 'highlight'
      element.toggleAttribute('highlighted', true)
      highlight.classList.remove('hide')
      grid.classList.add('hide')
    }

    const leaveHighlight = (event) => {
      highlight.classList.add('hide')
      grid.classList.remove('hide')
      const element = this.querySelector(`[slot=highlight]`)
      element.slot = currentId
      element.toggleAttribute('highlighted', false)
      currentId = null
      sessionStorage.removeItem('damdom-gallery:currentid')
    }

    backButton.addEventListener('click', leaveHighlight)

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
          container.querySelector('.highlightbutton').addEventListener('click', highlightButtonClick)
          node.slot = id
          grid.appendChild(container)
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

    enterHighlight(currentId)
  }
}

window.customElements.define('damdom-gallery', DamdomGalleryElement)
