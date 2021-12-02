export default class DamdomFileInputElement extends HTMLElement {
  #value
  #image

  static get observedAttributes() {
    return ['disabled', 'src']
  }

  constructor() {
    super()

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          position: relative;
          display: grid;
          align-items: center;
          justify-items: center;
          width: 100px;
          height: 100px;
          border-radius: 5px;
          overflow: hidden;
          border: 1px dotted white;
          cursor: pointer;
        }
        span {
          width: 60%;
          text-align: center;
        }
        .file {
          position: absolute;
          max-width: 90%;
          max-height: 90%;
        }
      </style>
      <img class="file">
      <span>Drag and drop media here</span>
    `

    this.#image = this.shadowRoot.querySelector('img')

    this.addEventListener('click', this.#onClick)
    this.addEventListener('drop', this.#onDrop)
    this.addEventListener('dragover', this.#onDragOver)
  }

  async #onClick(event) {
    const [fileHandle] = await window.showOpenFilePicker()
    this.#updateFile(await fileHandle.getFile())
  }

  #updateFile(file) {
    this.value = file
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      if (file.type.startsWith('image')) {
        this.#image.src = reader.result
      }
    })
    reader.readAsDataURL(file)
  }

  #onDrop = (event) => {
    event.preventDefault()
    const file = event.dataTransfer.items[0].getAsFile()
    if (!file) {
      return
    }
    this.#updateFile(file)
  }

  #onDragOver = (event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'src':
        fetch(newValue).then((response) => response.blob()).then((blob) => this.#updateFile(blob))
        break
      case 'disabled':
        if (newValue !== null) {
          this.removeEventListener('click', this.#onClick)
          this.removeEventListener('drop', this.#onDrop)
          this.removeEventListener('dragover', this.#onDragOver)
        } else {
          this.addEventListener('click', this.#onClick)
          this.addEventListener('drop', this.#onDrop)
          this.addEventListener('dragover', this.#onDragOver)
        }
        break
    }
  }

  get disabled() {
    return this.hasAttribute('disabled')
  }

  set disabled(value) {
    this.toggleAttribute('disabled', value)
  }

  get src() {
    return this.getAttribute('src')
  }

  set src(value) {
    this.setAttribute('src', value)
  }

  get value() {
    return this.#value
  }

  set value(value) {
    this.#value = value
    this.dispatchEvent(new Event('change', {
      bubbles: true,
    }))
  }
}

customElements.define('damdom-fileinput', DamdomFileInputElement)
