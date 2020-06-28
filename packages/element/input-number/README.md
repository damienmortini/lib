# `<damo-input-number>`

## Installation

```sh
npm install @damienmortini/element-input-number
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/element-input-number/index.js"></script>

<damo-input-number></damo-input-number>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/element-input-number';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```