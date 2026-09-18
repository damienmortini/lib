# `<damdom-gallery>`

## Installation

```sh
npm install @damienmortini/damdom-gallery
```

## Simple Usage
```html
<script src="node_modules/@damienmortini/damdom-gallery/index.js"></script>

<damdom-gallery>
  <my-first-demo></my-first-demo>
  <my-second-demo></my-second-demo>
</damdom-gallery>
```

Each child becomes an item in the grid with a control that expands it, and the
expanded item gets a control that collapses it again. `highlighted` is the
expanded child, settable from script, and the element fires `highlightchange`
when it moves:

```js
gallery.highlighted = gallery.querySelector('my-second-demo');
```

A control is named after the item it acts on, read from that item's
`aria-label`, `title`, or tag name, so name an item to name its control.

## Color scheme

The built-in look follows the page's `color-scheme` and declares none of its
own, so a page that offers a light/dark control sets the scheme itself:

```js
document.documentElement.style.colorScheme = 'dark';
```

## Styling

Retune the look through custom properties:

| Property | Styles |
| --- | --- |
| `--damo-gallery-background` | the grid and the expanded view behind the items |
| `--damo-gallery-color` | text inside both |
| `--damo-gallery-item-background` | each item's card |
| `--damo-gallery-item-radius` | its corners |
| `--damo-gallery-item-outline` | its edge |
| `--damo-gallery-item-shadow` | its shadow |
| `--damo-gallery-control-background` | the expand and collapse controls |
| `--damo-gallery-control-color` | their icons |
| `--damo-gallery-control-border` | their edge |
| `--damo-gallery-control-radius` | their corners |
| `--damo-gallery-control-shadow` | their shadow |

Reach the internals with `::part(grid)`, `::part(item)`, and `::part(control)`.

Switch the whole look off with `--damo-appearance: base`, the opt-out these
elements share, which leaves layout, controls and behaviour and takes away only
the appearance:

```css
damdom-gallery {
  --damo-appearance: base;
}
```

## Usage with custom name
```html
<script type="module">

  import Element from '@damienmortini/damdom-gallery';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
```
