# `<damo-viewer-array>`

## Installation

```sh
npm install @damienmortini/element-viewer-array
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/element-viewer-array/index.js"></script>

<damo-viewer-array></damo-viewer-array>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/element-viewer-array';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```