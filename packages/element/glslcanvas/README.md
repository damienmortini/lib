# `<damo-glslcanvas>`

## Installation

```sh
npm install @damienmortini/element-glslcanvas
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/element-glslcanvas/index.js"></script>

<damo-glslcanvas></damo-glslcanvas>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/element-glslcanvas';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```