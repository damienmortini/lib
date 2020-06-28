# `<damo-input-connector>`

## Installation

```sh
npm install @damienmortini/element-input-connector
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/element-input-connector/index.js"></script>

<damo-input-connector></damo-input-connector>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/element-input-connector';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```