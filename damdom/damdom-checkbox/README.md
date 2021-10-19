# `<damdom-input-checkbox>`

## Installation

```sh
npm install @damienmortini/damdom-checkbox
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/damdom-checkbox/index.js"></script>

<damdom-input-checkbox></damdom-input-checkbox>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/damdom-checkbox';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```