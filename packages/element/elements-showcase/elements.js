export default new Map([
  ['damo-animation-lottie', {
    preview: `<damo-animation-lottie autoplay loop src="assets/data.json"></damo-animation-lottie>`,
    demo: `<damo-animation-lottie style="width: 80%; height: 80%" customizable loop autoplay src="assets/bodymovin.json"></damo-animation-lottie>`,
  }],
  // 'damo-animation-sprite',
  // 'damo-animation-ticker',
  ['damo-animation-view', {}],
  ['damo-glslcanvas', {}],
  ['damo-input-signal-array', {}],
  ['damo-input-signal-beat', {}],
  ['damo-viewer-array', {
    preview: `<damo-viewer-array array='[1, 2, 5, 4, 3, 0, 1, 2, 1]'></damo-viewer-array>`,
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
    preview: `<damo-input-select value="World" options="['Hello', 'World', '!']"></damo-input-select>`,
  }],
  // 'damo-input-soundmatrix',
  ['damo-input-text', {}],
  // ['damo-link', {}],
  // ['damo-menu', {}],
  ['damo-select-lasso', {}],
  ['damo-starter-element', {}],
  ['damo-starter-gl', {}],
  ['damo-starter-three', {
    demo: `
      <style>
        damo-starter-three {
          width: 100%;
          height: 100%;
          touch-action: none;
        }
      </style>
      <damo-starter-three></damo-starter-three>
    `,
  }],
  ['damo-viewport', {
    preview: `<damo-viewport centered>
  <div style="position: absolute; background-color: red; width: 30px; height: 30px; top: 0; left: 0;"></div>
  <div
    style="position: absolute; background-color: green; width: 30px; height: 30px; border-radius: 50%; top: 30px; left: 30px;">
  </div>
</damo-viewport>`,
  }],
])

