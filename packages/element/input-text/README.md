# `<damo-input-text>`

## Installation

```sh
npm install @damienmortini/element-input-text
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/element-input-text/index.js"></script>

<damo-input-text></damo-input-text>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/element-input-text';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```