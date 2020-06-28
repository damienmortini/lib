# `<damo-viewport>`

## Installation

```sh
npm install @damienmortini/element-viewport
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/element-viewport/index.js"></script>

<damo-viewport></damo-viewport>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/element-viewport';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```