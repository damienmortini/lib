# `<damdom-textfield>`

## Installation

```sh
npm install @damienmortini/damdom-textfield
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/damdom-textfield/index.js"></script>

<damdom-textfield></damdom-textfield>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/damdom-textfield';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```