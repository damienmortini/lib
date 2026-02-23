#!/usr/bin/env node

import type { Format } from 'esbuild';
import { readFile } from 'fs/promises';
import path from 'path';

import { build } from '../index.js';

type TsConfigJson = {
  include?: string[];
  exclude?: string[];
  compilerOptions?: {
    outDir?: string;
    declaration?: boolean;
  };
};

// Find and parse tsconfig.json (JSONC) walking up from cwd — only walks up on file-not-found
const findTsConfig = async (dir: string): Promise<TsConfigJson | undefined> => {
  try {
    const text = await readFile(path.join(dir, 'tsconfig.json'), 'utf8');
    return JSON.parse(text.replace(/^\s*\/\/.*$/gm, '')) as TsConfigJson;
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') return undefined;
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    return findTsConfig(parent);
  }
};

const tsConfig = await findTsConfig(process.cwd());

const args = process.argv.slice(2);

let entryFiles = tsConfig?.include ?? ['**/*'];
let outputDirectory = tsConfig?.compilerOptions?.outDir ?? 'dist';
let watch = false;
let ignore = tsConfig?.exclude ?? ['**/node_modules/**'];
let bundle = false;
let minify = false;
let declaration = tsConfig?.compilerOptions?.declaration ?? false;
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
