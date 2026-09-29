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

## Selection

Pressing an item selects it, and expanding one selects it too. `selected` is
that child, settable from script, it carries a `selected` attribute, and the
element fires `selectchange` when it moves. The selected item lifts off the grid
and gets a control in its top-right corner that deselects it, as do Escape and a
click anywhere outside it while it sits in the grid. Read the new value from
`selected` in a `selectchange` listener, as with `highlighted`.

A selected item keeps touch gestures and the mouse wheel for itself, so dragging
or zooming inside it no longer scrolls the page. Any other item lets the page
pan and scroll as usual, and its content never sees wheel events: the gallery
stops them on the way in, so the page's own bubbling wheel listeners do not see
them either. That makes selection the natural switch for items that are
interactive or expensive to run:

```js
gallery.addEventListener('selectchange', () => {
  for (const item of gallery.children) item.toggleAttribute('running', item === gallery.selected);
});
```

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
| `--damo-gallery-item-hover-scale` | how far a hovered item lifts |
| `--damo-gallery-item-hover-shadow` | its shadow |
| `--damo-gallery-item-selected-scale` | how far the selected item lifts |
| `--damo-gallery-item-selected-shadow` | its shadow |
| `--damo-gallery-control-background` | the expand and collapse controls |
| `--damo-gallery-control-color` | their icons |
| `--damo-gallery-control-border` | their edge |
| `--damo-gallery-control-radius` | their corners |
| `--damo-gallery-control-shadow` | their shadow |
| `--damo-gallery-control-inset` | their distance from the item's corner |

Reach the internals with `::part(grid)`, `::part(item)`, and `::part(control)`.

Switch the whole look off with `--damo-appearance: base`. It takes away only the
appearance, leaving layout, controls and behaviour, so the gallery still works
while the page dresses it. The property is inherited, so setting it on an
ancestor covers anything else that reads it:

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
