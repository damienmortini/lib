# `<damo-animation-sprite>`

## Installation

```sh
npm install @damienmortini/element-animation-sprite
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/element-animation-sprite/index.js"></script>

<damo-animation-sprite></damo-animation-sprite>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/element-animation-sprite';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```