# `<damo-gl-view>`

## Installation

```sh
npm install @damienmortini/element-gl-view
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/element-gl-view/index.js"></script>

<damo-gl-view></damo-gl-view>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/element-gl-view';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```