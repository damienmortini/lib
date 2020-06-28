# `<damo-input-checkbox>`

## Installation

```sh
npm install @damienmortini/element-input-checkbox
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/element-input-checkbox/index.js"></script>

<damo-input-checkbox></damo-input-checkbox>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/element-input-checkbox';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```