# `<damo-input-colorpicker>`

## Installation

```sh
npm install @damienmortini/element-input-colorpicker
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/element-input-colorpicker/index.js"></script>

<damo-input-colorpicker></damo-input-colorpicker>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/element-input-colorpicker';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```