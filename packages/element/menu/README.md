# `<damo-menu>`

## Installation

```sh
npm install @damienmortini/element-menu
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/element-menu/index.js"></script>

<damo-menu></damo-menu>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/element-menu';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```