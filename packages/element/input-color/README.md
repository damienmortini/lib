# `<damo-input-color>`

## Installation

```sh
npm install @damienmortini/element-input-color
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/element-input-color/index.js"></script>

<damo-input-color></damo-input-color>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/element-input-color';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```