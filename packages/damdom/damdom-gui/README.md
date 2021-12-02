# `<damdom-gui>`

## Installation

```sh
npm install @damienmortini/damdom-gui
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/damdom-gui/index.js"></script>

<damdom-gui></damdom-gui>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/damdom-gui';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```