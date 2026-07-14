#!/usr/bin/env node

import { open } from 'fs/promises';

import { Server } from '../server.ts';

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
let auth: string | undefined;
let base: string | undefined;

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
    case '--port': {
      const portArgument = args[++i];
      if (portArgument) {
        const parsedPort = Number(portArgument);
        if (Number.isInteger(parsedPort)) {
          port = parsedPort;
        }
      }
      break;
    }
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
    case '--auth':
      auth = args[++i];
      break;
    case '--base':
      base = args[++i];
      break;
  }

  i++;
}

/**
 * Exit when the controlling terminal goes away. Closing a terminal only
 * signals the session leader, and script runners like pnpm swallow SIGHUP
 * without exiting, so no signal may ever reach this process — leaving an
 * orphaned server squatting the port. The lost terminal is still observable:
 * opening /dev/tty fails with ENXIO once it is gone. Poll for that. A process
 * with no controlling terminal at startup (daemonized) is left alone.
 */
try {
  await (await open('/dev/tty', 'r')).close();
  setInterval(async () => {
    try {
      await (await open('/dev/tty', 'r')).close();
    }
    catch (error) {
      if (error.code === 'ENXIO') process.exit(0);
    }
  }, 2000);
}
catch {
  // No controlling terminal to watch.
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
  auth,
  base,
});

await server.ready;
