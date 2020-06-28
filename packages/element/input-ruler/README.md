# `<damo-input-ruler>`

## Installation

```sh
npm install @damienmortini/element-input-ruler
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/element-input-ruler/index.js"></script>

<damo-input-ruler></damo-input-ruler>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/element-input-ruler';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```