# `<damo-animation-ticker>`

## Installation

```sh
npm install @damienmortini/element-animation-ticker
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/element-animation-ticker/index.js"></script>

<damo-animation-ticker></damo-animation-ticker>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/element-animation-ticker';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```