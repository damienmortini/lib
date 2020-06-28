# `<damo-animation-lottie>`

## Installation

```sh
npm install @damienmortini/element-animation-lottie
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/element-animation-lottie/index.js"></script>

<damo-animation-lottie></damo-animation-lottie>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/element-animation-lottie';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```