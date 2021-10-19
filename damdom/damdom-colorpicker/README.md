# `<damdom-colorpicker>`

## Installation

```sh
npm install @damienmortini/damdom-colorpicker
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/damdom-colorpicker/index.js"></script>

<damdom-colorpicker></damdom-colorpicker>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/damdom-colorpicker';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```