# `<element-gui>`

## Installation

```sh
npm config set @damienmortini:registry https://npm.pkg.github.com

npm install @damienmortini/element-gui
```

## Usage
```html
<script type="module">

  import MyElement from '@damienmortini/element-gui';

  window.customElements.define(`my-element-name`, MyElement);

</script>

<my-element-name></my-element-name>
```


Create a simple GUI Singleton
```
import GUIElement from '../../node_modules/@damienmortini/element-gui/index.js';

customElements.define('project-gui', GUIElement);

const guiElement = document.createElement('project-gui');
guiElement.style.position = 'absolute';
guiElement.style.top = '0';
guiElement.style.right = '0';

export default guiElement;
```