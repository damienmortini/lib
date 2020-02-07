# `<element-view>`

## Installation

```sh
npm config set @damienmortini:registry https://npm.pkg.github.com

npm install @damienmortini/element-view
```

## Usage
```html
<script type="module">

  import MyElement from '@damienmortini/element-view';

  window.customElements.define(`my-element-name`, MyElement);

</script>

<my-element-name></my-element-name>
```
