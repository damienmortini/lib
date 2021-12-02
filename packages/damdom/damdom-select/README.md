# `<damdom-select>`

## Installation

```sh
npm install @damienmortini/damdom-select
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/damdom-select/index.js"></script>

<damdom-select></damdom-select>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/damdom-select';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```