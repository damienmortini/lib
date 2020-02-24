export default class InputFileElement extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'disabled'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        input {
          width: 100%;
        }
      </style>
      <input type="file">
    `;

    this._input = this.shadowRoot.querySelector('input');

    this._input.addEventListener('input', (event) => {
      event.stopPropagation();
      // console.log(this._input.files);
      
      // fetch(window.URL.createObjectURL(this._input.files[0])).then((data) => {
      //   console.log(data);
        
      // });
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'value':
        try {
          this.value = new Function(`return ${newValue}`).apply(this);
        } catch (error) {
          this.value = newValue;
        }
        break;
      case 'disabled':
        this._input.disabled = this.disabled;
        break;
    }
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(value) {
    if (value) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  get value() {
    return this._value;
  }

  set value(value) {
    this._value = value;
  }
}
