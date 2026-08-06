import { strictEqual } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';

describe('packages reached through a symlinked node_modules', () => {
  // rootDirectory snapshots process.cwd() when this module loads, so each
  // served root is probed in a process of its own. Under `--input-type=module`
  // the probe's own import.meta.url is anchored in that working directory,
  // which is exactly the importer a page served from there would have.
  const probeSource = `
    import { resolveSpecifierToServedPath } from ${JSON.stringify(join(import.meta.dirname, 'module-resolution.ts'))};
    console.log(await resolveSpecifierToServedPath('@test/example', new URL(import.meta.url), '/'));
  `;
  let temporaryRoot: string;

  before(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), 'module-resolution-test-'));
    // A repository linking its workspace package by a relative path, plus a
    // scratch directory that borrows that whole node_modules through a symlink.
    await mkdir(join(temporaryRoot, 'repository', 'packages', 'example', 'dist'), { recursive: true });
    await mkdir(join(temporaryRoot, 'repository', 'node_modules', '@test'), { recursive: true });
    await mkdir(join(temporaryRoot, 'scratch'), { recursive: true });
    await writeFile(join(temporaryRoot, 'repository', 'packages', 'example', 'package.json'), '{"name":"@test/example","exports":"./dist/index.js"}');
    await writeFile(join(temporaryRoot, 'repository', 'packages', 'example', 'dist', 'index.js'), 'export const value = 1;');
    await symlink('../../packages/example', join(temporaryRoot, 'repository', 'node_modules', '@test', 'example'));
    await symlink('../repository/node_modules', join(temporaryRoot, 'scratch', 'node_modules'));
  });

  after(async () => {
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  function resolveExampleFrom(servedRootPath: string): string {
    return execFileSync(process.execPath, ['--input-type=module', '--eval', probeSource], { cwd: servedRootPath, encoding: 'utf8' }).trim();
  }

  it('keeps a package whose link target leaves the served root on its node_modules path', () => {
    strictEqual(resolveExampleFrom(join(temporaryRoot, 'scratch')), '/node_modules/@test/example/dist/index.js');
  });

  it('still collapses a link target that stays inside the served root', () => {
    strictEqual(resolveExampleFrom(join(temporaryRoot, 'repository')), '/packages/example/dist/index.js');
  });
});

describe('packages reached through a submodule mounted outside the served root', () => {
  // A playground-style root whose `submodules/repository` links to a sibling
  // checkout: the same package is reachable directly and through a consumer's
  // own node_modules, and both must land on one URL or the module evaluates
  // twice and customElements.define() throws on the second run.
  const probeSource = `
    import { pathToFileURL } from 'node:url';
    import { resolveSpecifierToServedPath } from ${JSON.stringify(join(import.meta.dirname, 'module-resolution.ts'))};
    const [specifier, importerPath] = process.argv.slice(-2);
    console.log(await resolveSpecifierToServedPath(specifier, pathToFileURL(importerPath), '/'));
  `;
  let temporaryRoot: string;
  let servedRootPath: string;

  before(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), 'module-resolution-mount-test-'));
    const repositoryPath = join(temporaryRoot, 'repository');
    servedRootPath = join(temporaryRoot, 'playground');
    for (const packageName of ['example', 'consumer']) {
      await mkdir(join(repositoryPath, 'packages', packageName, 'dist'), { recursive: true });
      await writeFile(join(repositoryPath, 'packages', packageName, 'package.json'), `{"name":"@test/${packageName}","exports":"./dist/index.js"}`);
      await writeFile(join(repositoryPath, 'packages', packageName, 'dist', 'index.js'), 'export const value = 1;');
    }
    // pnpm links a workspace dependency into its consumer's own node_modules.
    await mkdir(join(repositoryPath, 'packages', 'consumer', 'node_modules', '@test'), { recursive: true });
    await symlink('../../../example', join(repositoryPath, 'packages', 'consumer', 'node_modules', '@test', 'example'));
    await mkdir(join(servedRootPath, 'submodules'), { recursive: true });
    await symlink('../../repository', join(servedRootPath, 'submodules', 'repository'));
  });

  after(async () => {
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  function resolveFrom(specifier: string, importerPath: string): string {
    return execFileSync(process.execPath, ['--input-type=module', '--eval', probeSource, '--', specifier, importerPath], {
      cwd: servedRootPath,
      encoding: 'utf8',
    }).trim();
  }

  it('serves a mounted checkout package under its submodule path', () => {
    const importerPath = join(servedRootPath, 'submodules', 'repository', 'packages', 'consumer', 'dist', 'index.js');
    strictEqual(resolveFrom('@test/consumer', importerPath), '/submodules/repository/packages/consumer/dist/index.js');
  });

  it('collapses a dependency linked into a consumer onto that same mounted path', () => {
    const importerPath = join(servedRootPath, 'submodules', 'repository', 'packages', 'consumer', 'dist', 'index.js');
    strictEqual(resolveFrom('@test/example', importerPath), '/submodules/repository/packages/example/dist/index.js');
  });
});
