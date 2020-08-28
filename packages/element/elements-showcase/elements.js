export default [
  ['element-animation-lottie', {
    previewHTML: `<element-animation-lottie autoplay loop src="../element-animation-lottie/demo/data.json"></element-animation-lottie>`,
    demo: './demo/index.html',
  }],
  // 'element-animation-sprite',
  // 'element-animation-ticker',
  ['element-animation-view', {}],
  ['element-gl-view', {}],
  ['element-input-signal-array', {}],
  ['element-input-signal-beat', {}],
  ['element-viewer-array', {
    previewHTML: `<element-viewer-array array='[1, 2, 5, 4, 3, 0, 1, 2, 1]'></element-viewer-array>`,
  }],
  ['element-input-ruler', {}],
  ['element-input-button', {}],
  ['element-input-checkbox', {}],
  ['element-input-color', {}],
  ['element-input-colorpicker', {}],
  ['element-input-knob', {}],
  // ['element-input-connector', {}],
  // ['element-input-connector-linkable', {}],
  ['element-input-file', {}],
  ['element-input-joystick', {}],
  ['element-input-number', {}],
  ['element-input-pad-xy', {}],
  ['element-input-range', {}],
  ['element-input-select', {
    previewHTML: `<element-input-select value="World" options="['Hello', 'World', '!']"></element-input-select>`,
  }],
  // 'element-input-soundmatrix',
  ['element-input-text', {}],
  // ['element-link', {}],
  // ['element-menu', {}],
  ['element-select-lasso', {}],
  ['element-starter-element', {}],
  ['element-starter-gl', {}],
  ['element-starter-three', {}],
  ['element-viewport', {
    previewHTML: `<element-viewport centered>
  <div style="position: absolute; background-color: red; width: 30px; height: 30px; top: 0; left: 0;"></div>
  <div
    style="position: absolute; background-color: green; width: 30px; height: 30px; border-radius: 50%; top: 30px; left: 30px;">
  </div>
</element-viewport>`,
  }],
];

