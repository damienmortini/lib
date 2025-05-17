#!/usr/bin/env node

import type { Format } from 'esbuild';
import { readFile } from 'fs/promises';

import { build } from '../index.js';

const tsConfig = JSON.parse(await readFile(`${process.cwd()}/tsconfig.json`, 'utf8').catch(() => '{}'));

const args = process.argv.slice(2);

let entryFiles = tsConfig.include ?? ['**/*'];
let outputDirectory = tsConfig.compilerOptions?.outDir ?? 'dist';
let watch = false;
let ignore = tsConfig.exclude ?? ['**/node_modules/**'];
let bundle = false;
let minify = false;
let noDeclaration = false;
let copyAssets = false;
let format: Format = 'esm';

for (const [index, value] of args.entries()) {
  if (value === '--help' || value === '-h') {
    console.log(`
      Usage: package-builder [options]

      Options:
        --help, -h        Show this help message
        --input, -i       Entry file as a glob pattern, can be an array of glob patterns separated by comma (default: ${entryFiles.toString()})
        --output, -o      Output directory (default: ${outputDirectory})
        --watch, -w       Watch for changes
        --format -f       Output format 'iife' | 'cjs' | 'esm' (default: ${format})
        --bundle, -b      Bundle files
        --minify, -m      Minify files
        --ignore          Array of glob patterns separated by comma (default: ${ignore.toString()})
        --no-declaration  Do not generate declaration files
        --copy-assets     Copy assets instead of symlinking
    `);
    process.exit(0);
  }
  if (value === '--input' || value === '-i') {
    entryFiles = args[index + 1].split(',');
  }
  if (value === '--output' || value === '-o') {
    outputDirectory = args[index + 1];
  }
  if (value === '--watch' || value === '-w') {
    watch = true;
  }
  if (value === '--format' || value === '-f') {
    format = args[index + 1] as Format;
  }
  if (value === '--bundle' || value === '-b') {
    bundle = true;
  }
  if (value === '--minify' || value === '-m') {
    minify = true;
  }
  if (value === '--ignore') {
    ignore = args[index + 1].split(',');
  }
  if (value === '--no-declaration') {
    noDeclaration = true;
  }
  if (value === '--copy-assets') {
    copyAssets = true;
  }
}

await build({
  entryFiles,
  outputDirectory,
  watch,
  bundle,
  minify,
  format,
  ignore,
  noDeclaration,
  copyAssets,
});
