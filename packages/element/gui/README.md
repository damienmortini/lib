# `<damo-gui>`

## Installation

```sh
npm install @damienmortini/element-gui
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/element-gui/index.js"></script>

<damo-gui></damo-gui>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/element-gui';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```