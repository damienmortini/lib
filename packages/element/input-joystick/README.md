# `<damo-input-joystick>`

## Installation

```sh
npm install @damienmortini/element-input-joystick
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/element-input-joystick/index.js"></script>

<damo-input-joystick></damo-input-joystick>
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/element-input-joystick';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```