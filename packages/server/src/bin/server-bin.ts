#!/usr/bin/env node

import { Server } from '../server.js';

/**
 * Extract parameters
 */
let verbose = false;
let resolveModules = false;
let path: string;
let rootPath: string;
let watchIgnore: Array<string | RegExp>;
let port: number;
let useExternalCertificate = false;

for (const arg of process.argv) {
  if (arg.startsWith('--path')) {
    path = arg.split('=')[1].trim();
  }
  else if (arg.startsWith('--root')) {
    rootPath = arg.split('=')[1].trim();
  }
  else if (arg.startsWith('--watch-ignore')) {
    watchIgnore = arg.split('=')[1].trim().split(',');
  }
  else if (arg === '--verbose') {
    verbose = true;
  }
  else if (arg === '--resolve-modules') {
    resolveModules = true;
  }
  else if (arg.startsWith('--port')) {
    port = parseInt(arg.split('=')[1].trim());
  }
  else if (arg === '--external-certificate') {
    useExternalCertificate = true;
  }
}

const server = new Server({
  path,
  rootPath,
  watch: true,
  watchIgnore,
  verbose,
  resolveModules,
  port,
  useExternalCertificate,
});

await server.ready;
