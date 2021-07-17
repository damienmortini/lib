export default [
  ['damo-animation-lottie', {
    previewHTML: `<damo-animation-lottie autoplay loop src="../element-animation-lottie/demo/data.json"></damo-animation-lottie>`,
    demo: './demo/index.html',
  }],
  // 'damo-animation-sprite',
  // 'damo-animation-ticker',
  ['damo-animation-view', {}],
  ['damo-glslcanvas', {}],
  ['damo-input-signal-array', {}],
  ['damo-input-signal-beat', {}],
  ['damo-viewer-array', {
    previewHTML: `<damo-viewer-array array='[1, 2, 5, 4, 3, 0, 1, 2, 1]'></damo-viewer-array>`,
  }],
  ['damo-input-ruler', {}],
  ['damo-input-button', {}],
  ['damo-input-checkbox', {}],
  ['damo-input-color', {}],
  ['damo-input-colorpicker', {}],
  ['damo-input-knob', {}],
  // ['damo-input-connector', {}],
  // ['damo-input-connector-linkable', {}],
  ['damo-input-file', {}],
  ['damo-input-joystick', {}],
  ['damo-input-number', {}],
  ['damo-input-pad-xy', {}],
  ['damo-input-range', {}],
  ['damo-input-select', {
    previewHTML: `<damo-input-select value="World" options="['Hello', 'World', '!']"></damo-input-select>`,
  }],
  // 'damo-input-soundmatrix',
  ['damo-input-text', {}],
  // ['damo-link', {}],
  // ['damo-menu', {}],
  ['damo-select-lasso', {}],
  ['damo-starter-element', {}],
  ['damo-starter-gl', {}],
  ['damo-starter-three', {}],
  ['damo-viewport', {
    previewHTML: `<damo-viewport centered>
  <div style="position: absolute; background-color: red; width: 30px; height: 30px; top: 0; left: 0;"></div>
  <div
    style="position: absolute; background-color: green; width: 30px; height: 30px; border-radius: 50%; top: 30px; left: 30px;">
  </div>
</damo-viewport>`,
  }],
]

