# `<damo-input-knob>`

## Installation

```sh
npm install @damienmortini/element-input-knob
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/element-input-knob/index.js"></script>

<damo-input-knob></damo-input-knob>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/element-input-knob';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```