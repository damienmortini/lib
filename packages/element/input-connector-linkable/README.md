# `<damo-input-connector-linkable>`

## Installation

```sh
npm install @damienmortini/element-input-connector-linkable
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/element-input-connector-linkable/index.js"></script>

<damo-input-connector-linkable></damo-input-connector-linkable>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/element-input-connector-linkable';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```