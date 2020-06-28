# `<damo-input-button>`

## Installation

```sh
npm install @damienmortini/element-input-button
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/element-input-button/index.js"></script>

<damo-input-button></damo-input-button>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/element-input-button';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```