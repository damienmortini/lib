# `<damo-input-range>`

## Installation

```sh
npm install @damienmortini/element-input-range
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/element-input-range/index.js"></script>

<damo-input-range></damo-input-range>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/element-input-range';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```