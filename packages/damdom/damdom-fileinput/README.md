# `<damdom-fileinput>`

## Installation

```sh
npm install @damienmortini/damdom-fileinput
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/damdom-fileinput/index.js"></script>

<damdom-fileinput></damdom-fileinput>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/damdom-fileinput';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```