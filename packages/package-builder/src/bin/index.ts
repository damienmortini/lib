#!/usr/bin/env node

import type { Format } from 'esbuild';
import path from 'path';
import {
  findConfigFile,
  type ParsedCommandLine,
  parseJsonConfigFileContent,
  readConfigFile,
  sys as tsSys,
} from 'typescript';

import { build } from '../index.js';

// Find tsconfig.json file
const tsconfigPath = findConfigFile(process.cwd(), tsSys.fileExists, 'tsconfig.json');
let tsConfig: ParsedCommandLine | undefined;

if (tsconfigPath) {
  // Read tsconfig.json file
  const tsconfigFile = readConfigFile(tsconfigPath, tsSys.readFile);

  // Resolve extends
  if (tsconfigFile.config) {
    tsConfig = parseJsonConfigFileContent(
      tsconfigFile.config,
      tsSys,
      path.dirname(tsconfigPath),
    );
  }
}

const args = process.argv.slice(2);

const tsConfigRaw = tsConfig?.raw as { include?: string[]; exclude?: string[] } | undefined;

let entryFiles = tsConfigRaw?.include ?? ['**/*'];
let outputDirectory = tsConfig?.options?.outDir ?? 'dist';
let watch = false;
let ignore = tsConfigRaw?.exclude ?? ['**/node_modules/**'];
let bundle = false;
let minify = false;
let declaration = tsConfig?.options?.declaration ?? false;
let copyAssets = false;
let format: Format = 'esm';
let platform: 'node' | 'browser' = 'browser';

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
        --declaration     Generate declaration files
        --copy-assets     Copy assets instead of symlinking
        --platform        Specify the platform 'node' | 'browser' (default: ${platform})
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
  if (value === '--declaration') {
    declaration = true;
  }
  if (value === '--copy-assets') {
    copyAssets = true;
  }
  if (value === '--platform') {
    platform = args[index + 1] as 'node' | 'browser';
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
  declaration,
  copyAssets,
  platform,
});
