let inputSlotUID = 0;
let inputConnectorTagName = "input-connector";

/**
 * Node Element
 */
export default class NodeElement extends HTMLElement {
  static get observedAttributes() {
    return ["name", "draggable", "open", "x", "y", "width", "height"];
  }

  static get inputConnectorTagName() {
    return inputConnectorTagName;
  }

  static set inputConnectorTagName(value) {
    inputConnectorTagName = value;
  }

  constructor() {
    super();

    this.attachShadow({ mode: "open" }).innerHTML = `
      <style>
        :host {
          display: block;
          overflow: auto;
          resize: horizontal;
          border: 1px dotted;
          background: rgba(255, 255, 255, .9);
        }
        :host(:hover) {
          border: 1px dashed;
        }
        :host(:focus-within) {
          border: 1px solid;
          z-index: 1;
        }
        .content, slot {
          padding: 5px;
        }
        datails summary {
          position: relative;
          padding: 5px;
          outline: none;
        }
        section.input {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        section.input .input {
          flex: 2;
          min-width: 50%;
          text-align: center;
        }
        section.input label {
          overflow: hidden;
          text-overflow: ellipsis;
          padding: 0 5px;
          white-space: nowrap;
          flex: 1;
        }
        section.input label:empty {
          display: none;
        }
        :host([noconnector]) section.input ${inputConnectorTagName} {
          display: none;
        }
      </style>
      <details class="content" open>
        <summary></summary>
        <slot></slot>
      </details>
    `;

    // <graph-draggable targets="[this.getRootNode().host]"></graph-draggable>
    // this._draggable = this.shadowRoot.querySelector("graph-draggable");
    // this._draggable.handles = [this.shadowRoot.querySelector("summary"), this.shadowRoot.querySelector(".content")];

    // this.open = true;
    // this.draggable = true;

    const observer = new MutationObserver((mutationsList, observer) => {
      for (const mutation of mutationsList) {
        for (const node of mutation.addedNodes) {
          if (!("value" in node)) {
            continue;
          }
          this._addInput(node);
        }
        for (const node of mutation.removedNodes) {
          if (!("value" in node)) {
            continue;
          }
          this.shadowRoot.querySelector(`section#slot${node.slot}`).remove();
        }
      }
    });
    observer.observe(this, { childList: true });
  }

  connectedCallback() {
    for (const child of this.children) {
      if (!("value" in child)) {
        continue;
      }
      this._addInput(child);
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "name":
        this.shadowRoot.querySelector(".content").querySelector("summary").textContent = newValue;
        break;
      case "draggable":
        // console.log(newValue);
        break;
      case "open":
        this.shadowRoot.querySelector(".content").open = newValue;
        break;
      case "x":
        this.style.left = `${this.x}px`;
        break;
      case "y":
        this.style.top = `${this.y}px`;
        break;
      case "width":
        this.style.width = `${this.width}px`;
        break;
      case "height":
        this.style.height = `${this.height}px`;
        break;
    }
  }

  _addInput(node) {
    if (this.shadowRoot.querySelector(`slot[name="${node.slot}"]`)) {
      return;
    }
    const label = node.label || node.name || node.id || "";
    const section = document.createElement("section");
    section.id = `slot${inputSlotUID}`;
    section.classList.add("input");
    section.innerHTML = `
      <${inputConnectorTagName}></${inputConnectorTagName}>
      <label title="${label}">${label}</label>
      <div class="input"><slot name="${inputSlotUID}"></slot></div>
      <${inputConnectorTagName}></${inputConnectorTagName}>
    `;
    const connectors = section.querySelectorAll(`${inputConnectorTagName}`);
    if (connectors[0].outputs) {
      connectors[0].outputs.add(node);
    }
    if (connectors[0].inputs) {
      connectors[1].inputs.add(node);
    }
    this.shadowRoot.querySelector(".content").appendChild(section);
    node.slot = inputSlotUID;
    inputSlotUID++;
  }

  set open(value) {
    if (value) {
      this.shadowRoot.querySelector(".content").setAttribute("open", "");
    } else {
      this.shadowRoot.querySelector(".content").removeAttribute("open");
    }
  }

  get open() {
    return this.shadowRoot.querySelector(".content").hasAttribute("open");
  }

  get name() {
    return this.getAttribute("name");
  }

  set name(value) {
    this.setAttribute("name", value);
  }

  get noConnector() {
    return this.hasAttribute("noconnector");
  }

  set noConnector(value) {
    if (value) {
      this.setAttribute("noconnector", "");
    } else {
      this.removeAttribute("noconnector");
    }
  }

  get x() {
    return Number(this.getAttribute("x"));
  }

  set x(value) {
    this.setAttribute("x", String(value));
  }

  get y() {
    return Number(this.getAttribute("y"));
  }

  set y(value) {
    this.setAttribute("y", String(value));
  }

  get width() {
    return Number(this.getAttribute("width"));
  }

  set width(value) {
    this.setAttribute("width", String(value));
  }

  get height() {
    return Number(this.getAttribute("height"));
  }

  set height(value) {
    this.setAttribute("height", String(value));
  }
}
