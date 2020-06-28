# `<damo-link>`

## Installation

```sh
npm install @damienmortini/element-link
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/element-link/index.js"></script>

<damo-link></damo-link>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/element-link';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```