import { match, ok } from 'node:assert';
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
describe('declaration emit', () => {
  let temporaryRoot: string;
  let workingDirectory: string;

  before(async () => {
    workingDirectory = process.cwd();
    temporaryRoot = await mkdtemp(join(tmpdir(), 'package-builder-test-'));
    await mkdir(join(temporaryRoot, 'src'), { recursive: true });
    await writeFile(join(temporaryRoot, 'package.json'), '{"name":"fixture","type":"module"}');
    // Standalone rather than extending the repository config: the fixture sits outside the
    // workspace, so anything it inherits would have to resolve from there too.
    await writeFile(join(temporaryRoot, 'tsconfig.json'), JSON.stringify({
      compilerOptions: {
        target: 'ESNext',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        types: [],
      },
      include: ['src'],
    }));
    await writeFile(join(temporaryRoot, 'src', 'index.ts'), 'export function add(first: number, second: number): number {\n  return first + second;\n}\n');
    process.chdir(temporaryRoot);
  });

  after(async () => {
    process.chdir(workingDirectory);
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  it('writes a .d.ts carrying the source signature', async () => {
    await build({ platform: 'node' });

    const declaration = await readFile(join(temporaryRoot, 'dist', 'index.d.ts'), 'utf8');
    match(declaration, /declare function add\(first: number, second: number\): number/);
    ok(await readFile(join(temporaryRoot, 'dist', 'index.js'), 'utf8'));
  });
});
