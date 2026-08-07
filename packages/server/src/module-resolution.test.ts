import { strictEqual } from 'node:assert';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';

import { ModuleResolver } from './module-resolution.ts';

describe('packages reached through a symlinked node_modules', () => {
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

  // No importer: resolved from the served root, like a page sitting at it.
  async function resolveExampleFrom(servedRootPath: string): Promise<string | undefined> {
    return await new ModuleResolver(servedRootPath).resolveSpecifierToServedPath('@test/example', undefined, '/');
  }

  it('keeps a package whose link target leaves the served root on its node_modules path', async () => {
    strictEqual(await resolveExampleFrom(join(temporaryRoot, 'scratch')), '/node_modules/@test/example/dist/index.js');
  });

  it('still collapses a link target that stays inside the served root', async () => {
    strictEqual(await resolveExampleFrom(join(temporaryRoot, 'repository')), '/packages/example/dist/index.js');
  });
});

describe('packages reached through a submodule mounted outside the served root', () => {
  // A playground-style root whose `submodules/repository` links to a sibling
  // checkout: the same package is reachable directly and through a consumer's
  // own node_modules, and both must land on one URL or the module evaluates
  // twice and customElements.define() throws on the second run.
  let temporaryRoot: string;
  let resolver: ModuleResolver;
  let consumerImporterPath: string;

  before(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), 'module-resolution-mount-test-'));
    const repositoryPath = join(temporaryRoot, 'repository');
    const servedRootPath = join(temporaryRoot, 'playground');
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
    resolver = new ModuleResolver(servedRootPath);
    consumerImporterPath = join(servedRootPath, 'submodules', 'repository', 'packages', 'consumer', 'dist', 'index.js');
  });

  after(async () => {
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  it('serves a mounted checkout package under its submodule path', async () => {
    const servedPath = await resolver.resolveSpecifierToServedPath('@test/consumer', pathToFileURL(consumerImporterPath), '/');
    strictEqual(servedPath, '/submodules/repository/packages/consumer/dist/index.js');
  });

  it('collapses a dependency linked into a consumer onto that same mounted path', async () => {
    const servedPath = await resolver.resolveSpecifierToServedPath('@test/example', pathToFileURL(consumerImporterPath), '/');
    strictEqual(servedPath, '/submodules/repository/packages/example/dist/index.js');
  });
});

describe('a resolver anchored somewhere other than the process working directory', () => {
  let temporaryRoot: string;
  let resolver: ModuleResolver;

  before(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), 'module-resolution-root-test-'));
    await mkdir(join(temporaryRoot, 'node_modules', 'demo-package'), { recursive: true });
    await writeFile(join(temporaryRoot, 'node_modules', 'demo-package', 'package.json'), '{"name":"demo-package","main":"index.js"}');
    await writeFile(join(temporaryRoot, 'node_modules', 'demo-package', 'index.js'), 'export const demo = true;');
    await writeFile(join(temporaryRoot, 'module.js'), 'import { demo } from \'demo-package\';\n');
    resolver = new ModuleResolver(temporaryRoot);
  });

  after(async () => {
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  // The crawl reaches the page's module, maps its bare import and enumerates the
  // installed packages — all of it against the fixture root rather than the cwd.
  it('crawls a page into an import map rooted there', async () => {
    const pageContent = '<html><head><script type="module" src="/module.js"></script></head></html>';
    const { importMap } = await resolver.buildImportMap(pageContent, '/index.html', '/');
    strictEqual(importMap.imports['demo-package'], '/node_modules/demo-package/index.js');
  });
});
