#!/usr/bin/env node

import { open } from 'fs/promises';
import QRCode from 'qrcode';
import { parseArgs } from 'util';

import { Server } from '../server.ts';

const usage = `Usage: server [--path <path>] [--root <path>] [--base <base>] [--port <port>] [--host <address>]
              [--watch <path>] [--watch-ignore <a,b>] [--proxy <path> <target>]
              [--auth <user:pass>] [--external-certificate] [--resolve-modules]
              [--directory-listing] [--no-live-reload] [--error-details] [--verbose] [--help]`;

function parseCommandLine(): ConstructorParameters<typeof Server>[0] {
  const { values, tokens } = parseArgs({
    // pnpm hands a script the `--` its own command line had, and the options are after it.
    args: process.argv.slice(2).filter(argument => argument !== '--'),
    allowPositionals: true,
    tokens: true,
    options: {
      'path': { type: 'string' },
      'root': { type: 'string' },
      'base': { type: 'string' },
      'port': { type: 'string' },
      'host': { type: 'string' },
      'watch': { type: 'string', multiple: true },
      'watch-ignore': { type: 'string' },
      'proxy': { type: 'string', multiple: true },
      'auth': { type: 'string' },
      'external-certificate': { type: 'boolean' },
      'resolve-modules': { type: 'boolean' },
      'directory-listing': { type: 'boolean' },
      'no-live-reload': { type: 'boolean' },
      'error-details': { type: 'boolean' },
      'verbose': { type: 'boolean' },
      'help': { type: 'boolean' },
    },
  });

  if (values.help) {
    console.log(usage);
    process.exit(0);
  }

  // `--proxy` takes two values and `parseArgs` gives an option one, so the target is the
  // positional right after it. Any other positional belongs to nothing.
  const proxy: { [path: string]: string } = {};
  for (const [index, token] of tokens.entries()) {
    const previous = tokens[index - 1];
    if (token.kind === 'option' && token.name === 'proxy') {
      const target = tokens[index + 1];
      if (!token.value || target?.kind !== 'positional' || !target.value) {
        throw new Error('Option \'--proxy <path> <target>\' needs both a path and a target');
      }
      proxy[token.value] = target.value;
    }
    else if (token.kind === 'positional' && !(previous?.kind === 'option' && previous.name === 'proxy')) {
      throw new Error(`Unexpected argument '${token.value}'`);
    }
  }

  if (values.port !== undefined && !/^\d+$/.test(values.port)) {
    throw new Error(`Option '--port <port>' needs an integer, got '${values.port}'`);
  }

  return {
    path: values.path,
    rootPath: values.root,
    watch: !values['no-live-reload'],
    watchIgnore: values['watch-ignore']?.split(','),
    watchPaths: values.watch?.filter(Boolean),
    verbose: values.verbose,
    resolveModules: values['resolve-modules'],
    port: values.port === undefined ? undefined : Number(values.port),
    // An empty host would make `listen` bind every interface.
    host: values.host || undefined,
    useExternalCertificate: values['external-certificate'],
    proxy,
    auth: values.auth,
    base: values.base,
    directoryListing: values['directory-listing'],
    errorDetails: values['error-details'],
  };
}

let options: ReturnType<typeof parseCommandLine>;
try {
  options = parseCommandLine();
}
catch (error) {
  console.error(`${error.message}\n\n${usage}`);
  process.exit(1);
}

// A credential passed as `--auth` lands in the process's argv, which is
// world-readable through /proc/<pid>/cmdline and surfaces in every `ps` listing,
// crash dump and monitoring snapshot. SERVER_AUTH is read when the flag is
// absent so callers can keep the credential out of argv: a process environment
// is owner-only (/proc/<pid>/environ is mode 0400). The flag still wins when
// both are set, so existing invocations are unaffected.
const auth = options.auth ?? process.env.SERVER_AUTH;

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

const server = new Server({ ...options, auth });

await server.ready;

for (const [index, url] of server.urls.entries()) {
  console.log(url);
  if (index !== 0) {
    console.log(await QRCode.toString(url, { type: 'terminal', small: true }));
  }
}
