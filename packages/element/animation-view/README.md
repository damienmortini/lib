# `<damo-animation-view>`

## Installation

```sh
npm install @damienmortini/element-animation-view
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/element-animation-view/index.js"></script>

<damo-animation-view></damo-animation-view>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/element-animation-view';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```