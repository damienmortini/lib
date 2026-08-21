import { installDomGlobals, installPointerCaptureShim } from '@damienmortini/test-support';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/',
});
const { window } = dom;

installDomGlobals(window);
installPointerCaptureShim(window);
