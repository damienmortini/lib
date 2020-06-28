# `<damo-select-lasso>`

## Installation

```sh
npm install @damienmortini/element-select-lasso
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/element-select-lasso/index.js"></script>

<damo-select-lasso></damo-select-lasso>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/element-select-lasso';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```