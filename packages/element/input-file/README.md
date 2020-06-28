# `<damo-input-file>`

## Installation

```sh
npm install @damienmortini/element-input-file
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/element-input-file/index.js"></script>

<damo-input-file></damo-input-file>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/element-input-file';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```