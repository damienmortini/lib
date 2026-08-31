import { match, ok, strictEqual } from 'node:assert';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';

import { build } from './index.ts';

// Nothing in this repository consumes package-builder, so its only interesting code path —
// spawning the TypeScript compiler to emit declarations — is unexercised by every other
// package's build. It has broken silently before: the compiler is resolved by subpath, and
// a compatibility shim that renamed its binary left `import.meta.resolve` pointing at a file
// that did not exist. Building a real package here is the only way that shows up.

const temporaryRoots: string[] = [];

// Standalone tsconfig rather than one extending the repository's: the fixture sits outside
// the workspace, so anything it inherited would have to resolve from there too.
async function createFixture(source: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'package-builder-test-'));
  temporaryRoots.push(root);
  await mkdir(join(root, 'src'), { recursive: true });
  await writeFile(join(root, 'package.json'), '{"name":"fixture","type":"module"}');
  await writeFile(join(root, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ESNext',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      types: [],
    },
    include: ['src'],
  }));
  await writeFile(join(root, 'src', 'index.ts'), source);
  return root;
}

describe('declaration emit', () => {
  let workingDirectory: string;

  before(() => {
    workingDirectory = process.cwd();
  });

  after(async () => {
    process.chdir(workingDirectory);
    await Promise.all(temporaryRoots.map(root => rm(root, { recursive: true, force: true })));
  });

  it('writes a .d.ts carrying the source signature', async () => {
    const root = await createFixture('export function add(first: number, second: number): number {\n  return first + second;\n}\n');
    process.chdir(root);

    await build({ platform: 'node' });

    const declaration = await readFile(join(root, 'dist', 'index.d.ts'), 'utf8');
    match(declaration, /declare function add\(first: number, second: number\): number/);
    ok(await readFile(join(root, 'dist', 'index.js'), 'utf8'));
  });

  // In a child process rather than in-process, because the failure this guards is the build
  // never ending: esbuild holds a service child process open for a context, and until that
  // context was disposed on the failing path too, a rejected build left the service running
  // and nothing that asked for a build could exit. The child catches the rejection and lets
  // the event loop end the process on its own, so a surviving handle shows up as no exit at
  // all rather than as a failure; `process.exitCode` is what keeps that exit natural.
  it('fails the build and still lets the process exit', async () => {
    const root = await createFixture('export const count: number = \'not a number\';\n');
    const entry = new URL('./index.ts', import.meta.url).href;
    const script = `const { build } = await import(${JSON.stringify(entry)});
let rejected = false;
try { await build({ platform: 'node' }); }
catch { rejected = true; }
process.exitCode = rejected ? 7 : 0;`;

    const exitCode = await new Promise<number | null>((resolvePromise, rejectPromise) => {
      const child = spawn(
        process.execPath,
        ['--input-type=module', '--eval', script],
        { cwd: root, stdio: 'ignore' },
      );
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        rejectPromise(new Error('build did not exit within 60s after a failed declaration emit'));
      }, 60_000);
      child.on('error', rejectPromise);
      child.on('exit', (code) => {
        clearTimeout(timer);
        resolvePromise(code);
      });
    });

    strictEqual(exitCode, 7, `expected the build to reject and the process to exit, got ${exitCode}`);
  });
});
