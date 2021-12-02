# `<damdom-input-range>`

## Installation

```sh
npm install @damienmortini/damdom-rangeinput
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/damdom-rangeinput/index.js"></script>

<damdom-input-range></damdom-input-range>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/damdom-rangeinput';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```