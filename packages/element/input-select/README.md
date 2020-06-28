# `<damo-input-select>`

## Installation

```sh
npm install @damienmortini/element-input-select
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/element-input-select/index.js"></script>

<damo-input-select></damo-input-select>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/element-input-select';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```