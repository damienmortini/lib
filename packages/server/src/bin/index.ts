#!/usr/bin/env node

import { Server } from '../server.js';

const args = process.argv.slice(2);
let verbose = false;
let resolveModules = false;
let path: string | undefined;
let rootPath: string | undefined;
let watchIgnore: Array<string | RegExp> | undefined;
const watchPaths: Array<string> = [];
let port: number | undefined;
let useExternalCertificate = false;
const proxy: { [path: string]: string } = {};

let i = 0;
while (i < args.length) {
  const arg = args[i];

  switch (arg) {
    case '--path':
      path = args[++i];
      break;
    case '--root':
      rootPath = args[++i];
      break;
    case '--watch-ignore':
      watchIgnore = args[++i]?.split(',');
      break;
    case '--verbose':
      verbose = true;
      break;
    case '--resolve-modules':
      resolveModules = true;
      break;
    case '--port':
      port = parseInt(args[++i]);
      break;
    case '--external-certificate':
      useExternalCertificate = true;
      break;
    case '--proxy': {
      const proxyPath = args[++i];
      const proxyTarget = args[++i];
      if (proxyPath && proxyTarget) {
        proxy[proxyPath] = proxyTarget;
      }
      break;
    }
    case '--watch': {
      const watchPath = args[++i];
      if (watchPath) {
        watchPaths.push(watchPath);
      }
      break;
    }
  }

  i++;
}

const server = new Server({
  path,
  rootPath,
  watch: true,
  watchIgnore,
  watchPaths,
  verbose,
  resolveModules,
  port,
  useExternalCertificate,
  proxy,
});

await server.ready;
