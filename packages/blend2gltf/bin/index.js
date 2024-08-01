#!/usr/bin/env node

import { blend2gltf } from '../index.js';

let path;
let watch = false;

for (const arg of process.argv) {
  if (arg.startsWith('--path')) {
    path = arg.split('=')[1].trim();
  }
  else if (arg === '--watch') {
    watch = true;
  }
}

blend2gltf({
  path,
  watch,
});
