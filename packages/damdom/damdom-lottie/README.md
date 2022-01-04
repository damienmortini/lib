# `<damdom-lottie>`

## Installation

```sh
npm install @damienmortini/damdom-lottie
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/damdom-lottie/index.js"></script>

<damdom-lottie></damdom-lottie>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/damdom-lottie';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```