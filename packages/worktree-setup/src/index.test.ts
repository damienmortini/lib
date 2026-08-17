// Exercised against real git worktrees and real symlinks, because that is what the subject
// is: every interesting case here — a relative link that dangles once it is copied, a
// package only the branch has — is a fact about the filesystem, and a stubbed one would
// prove nothing about the tree these repositories actually get.

import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';

import { setupWorktree } from './index.ts';
import { checkouts, write } from './test-checkouts.ts';

test('mirrors the primary checkout, copying relative links and skipping pnpm bookkeeping', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();
  const modules = path.join(primaryRoot, 'node_modules');

  await write(path.join(modules, 'installed/index.js'), '');
  await write(path.join(modules, '.modules.yaml'), 'hoistPattern: []');
  await write(path.join(modules, '.pnpm/registry/index.js'), '');
  await write(path.join(primaryRoot, 'packages/local/index.js'), '');
  await fs.mkdir(path.join(modules, '@scope'), { recursive: true });
  await fs.symlink('../../packages/local', path.join(modules, '@scope/local'));
  await fs.mkdir(path.join(modules, '.bin'), { recursive: true });
  await fs.symlink('../@scope/local/index.js', path.join(modules, '.bin/local'));
  // The worktree has the branch's own copy of the package the relative links point at.
  await write(path.join(worktreeRoot, 'packages/local/index.js'), '');

  await setupWorktree({ directory: worktreeRoot });

  const worktreeModules = path.join(worktreeRoot, 'node_modules');
  assert.equal(await fs.readlink(path.join(worktreeModules, 'installed')), path.join(modules, 'installed'));
  // Copied verbatim, so it resolves to the worktree's own package rather than the primary's.
  assert.equal(await fs.readlink(path.join(worktreeModules, '@scope/local')), '../../packages/local');
  assert.equal(await fs.realpath(path.join(worktreeModules, '@scope/local')), path.join(worktreeRoot, 'packages/local'));
  assert.equal(await fs.readlink(path.join(worktreeModules, '.bin/local')), '../@scope/local/index.js');
  // Leaving these out is what keeps an install run here from writing back into the primary.
  assert.equal(existsSync(path.join(worktreeModules, '.modules.yaml')), false);
  assert.equal(existsSync(path.join(worktreeModules, '.pnpm')), false);
});

test('links a package the branch adds, which the primary checkout knows nothing about', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();

  await write(path.join(worktreeRoot, 'packages/added/package.json'), '{"name":"@scope/added"}');
  // Nested where pnpm nests what it cannot hoist, and only in the primary.
  await write(path.join(primaryRoot, 'packages/added/node_modules/dependency/index.js'), '');

  await setupWorktree({ directory: worktreeRoot, packageDirectories: ['packages'] });

  assert.equal(
    await fs.realpath(path.join(worktreeRoot, 'node_modules/@scope/added')),
    path.join(worktreeRoot, 'packages/added'),
  );
  assert.equal(existsSync(path.join(worktreeRoot, 'packages/added/node_modules/dependency')), true);
});

test('links the workspace members the worktree\'s own pnpm-workspace.yaml declares', async () => {
  const { worktreeRoot } = await checkouts();

  // Declared only in the yaml — no `packageDirectories` option names this root.
  await write(path.join(worktreeRoot, 'pnpm-workspace.yaml'), 'packages:\n  - \'modules/*\'\n');
  await write(path.join(worktreeRoot, 'modules/thing/package.json'), '{"name":"@scope/thing"}');

  await setupWorktree({ directory: worktreeRoot });

  assert.equal(
    await fs.realpath(path.join(worktreeRoot, 'node_modules/@scope/thing')),
    path.join(worktreeRoot, 'modules/thing'),
  );
});

test('links a workspace member behind a submodule symlink, without writing into the sibling', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();

  // A sibling checkout both trees reach through a committed-shaped `submodules/<name>` link,
  // holding a workspace member with an installed node_modules of its own.
  const sibling = path.join(path.dirname(primaryRoot), 'sibling');
  await write(path.join(sibling, 'packages/tool/package.json'), '{"name":"@scope/tool"}');
  await write(path.join(sibling, 'packages/tool/node_modules/dependency/index.js'), '');
  await fs.mkdir(path.join(worktreeRoot, 'submodules'), { recursive: true });
  await fs.symlink('../../sibling', path.join(worktreeRoot, 'submodules/sibling'));
  await write(path.join(worktreeRoot, 'pnpm-workspace.yaml'), 'packages:\n  - "submodules/*/packages/**"\n');

  await setupWorktree({ directory: worktreeRoot });

  // The scope link exists and follows the worktree's own submodule path to the sibling.
  assert.equal(
    await fs.realpath(path.join(worktreeRoot, 'node_modules/@scope/tool')),
    path.join(sibling, 'packages/tool'),
  );
  // The sibling's installed tree is shared and was not mirrored over.
  assert.equal(existsSync(path.join(sibling, 'packages/tool/node_modules/dependency/index.js')), true);
});

test('refuses a pnpm-workspace.yaml shape it cannot read, rather than linking less than declared', async () => {
  const { worktreeRoot } = await checkouts();
  await write(path.join(worktreeRoot, 'pnpm-workspace.yaml'), 'packages:\n  - \'packages/**\'\n  - \'!packages/fixtures/**\'\n');

  await assert.rejects(setupWorktree({ directory: worktreeRoot }), /exclusion glob/);
});

test('refuses a glob it cannot expand, rather than matching it against nothing', async () => {
  const { worktreeRoot } = await checkouts();
  await write(path.join(worktreeRoot, 'pnpm-workspace.yaml'), 'packages:\n  - \'packages/web-*\'\n');

  await assert.rejects(setupWorktree({ directory: worktreeRoot }), /cannot expand/);
});

test('reads past comments inside the packages block, instead of ending it there', async () => {
  const { worktreeRoot } = await checkouts();

  await write(path.join(worktreeRoot, 'pnpm-workspace.yaml'), 'packages:\n# a flush-left note\n  - "modules/*"\n');
  await write(path.join(worktreeRoot, 'modules/thing/package.json'), '{"name":"@scope/thing"}');

  await setupWorktree({ directory: worktreeRoot });

  assert.equal(existsSync(path.join(worktreeRoot, 'node_modules/@scope/thing')), true);
});

test('follows a symlink inside a `**` glob, the way pnpm expands it', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();

  const sibling = path.join(path.dirname(primaryRoot), 'starred-sibling');
  await write(path.join(sibling, 'packages/tool/package.json'), '{"name":"@scope/starred-tool"}');
  await fs.mkdir(path.join(worktreeRoot, 'submodules'), { recursive: true });
  await fs.symlink('../../starred-sibling', path.join(worktreeRoot, 'submodules/sibling'));
  await write(path.join(worktreeRoot, 'pnpm-workspace.yaml'), 'packages:\n  - \'submodules/**\'\n');

  await setupWorktree({ directory: worktreeRoot });

  assert.equal(
    await fs.realpath(path.join(worktreeRoot, 'node_modules/@scope/starred-tool')),
    path.join(sibling, 'packages/tool'),
  );
});

test('skips a nameless fixture manifest a glob sweeps up, which pnpm links past too', async () => {
  const { worktreeRoot } = await checkouts();

  await write(path.join(worktreeRoot, 'pnpm-workspace.yaml'), 'packages:\n  - \'packages/**\'\n');
  await write(path.join(worktreeRoot, 'packages/real/package.json'), '{"name":"@scope/real"}');
  await write(path.join(worktreeRoot, 'packages/real/test/fixtures/package.json'), '{}');

  await setupWorktree({ directory: worktreeRoot });

  assert.equal(existsSync(path.join(worktreeRoot, 'node_modules/@scope/real')), true);
});

test('does not read a configured root itself as a member, matching pnpm\'s trailing-`**`', async () => {
  const { worktreeRoot } = await checkouts();

  await write(path.join(worktreeRoot, 'packages/package.json'), '{"name":"@scope/root-manifest"}');
  await write(path.join(worktreeRoot, 'packages/app/package.json'), '{"name":"@scope/app"}');

  await setupWorktree({ directory: worktreeRoot, packageDirectories: ['packages'] });

  assert.equal(existsSync(path.join(worktreeRoot, 'node_modules/@scope/app')), true);
  assert.equal(existsSync(path.join(worktreeRoot, 'node_modules/@scope/root-manifest')), false);
});

test('fails on a dependency the root manifest declares and nothing installs', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();

  await write(path.join(worktreeRoot, 'package.json'), '{"name":"repository","dependencies":{"absent-everywhere":"1.0.0"}}');

  await assert.rejects(
    setupWorktree({ directory: worktreeRoot }),
    (error: Error) => {
      assert.match(error.message, new RegExp(`package.json declares absent-everywhere, which ${primaryRoot} has not installed`));
      return true;
    },
  );
});

test('links a scoped declared dependency from a primary location the mirror does not cover', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();

  await write(path.join(primaryRoot, 'packages/node_modules/@scope/nested/index.js'), '');
  await write(path.join(worktreeRoot, 'packages/app/package.json'), '{"name":"@scope/app","dependencies":{"@scope/nested":"^1.0.0"}}');

  await setupWorktree({ directory: worktreeRoot, packageDirectories: ['packages'] });

  assert.equal(
    await fs.realpath(path.join(worktreeRoot, 'packages/app/node_modules/@scope/nested')),
    path.join(primaryRoot, 'packages/node_modules/@scope/nested'),
  );
});

test('works without a root package.json, which a repository of pure submodules may not have', async () => {
  const { worktreeRoot } = await checkouts();
  await fs.rm(path.join(worktreeRoot, 'package.json'));

  await setupWorktree({ directory: worktreeRoot });

  assert.equal(existsSync(path.join(worktreeRoot, 'node_modules')), true);
});

test('resolves a declared dependency through the mirrored tree', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();

  await write(path.join(primaryRoot, 'node_modules/installed/index.js'), '');
  await write(path.join(worktreeRoot, 'packages/app/package.json'), '{"name":"@scope/app","dependencies":{"installed":"^1.0.0"}}');

  await setupWorktree({ directory: worktreeRoot, packageDirectories: ['packages'] });
});

test('fails naming a declared dependency the primary checkout has never installed', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();

  // The branch adds a devDependency; the primary has no such edge anywhere. Mirroring alone
  // used to report this tree linked, and the suite failed later in module resolution.
  await write(path.join(worktreeRoot, 'packages/app/package.json'), '{"name":"@scope/app","devDependencies":{"jsdom":"^24.0.0"}}');

  await assert.rejects(
    setupWorktree({ directory: worktreeRoot, packageDirectories: ['packages'] }),
    (error: Error) => {
      assert.match(error.message, new RegExp(`packages/app/package.json declares jsdom, which ${primaryRoot} has not installed`));
      return true;
    },
  );
});

test('fails when a declared workspace member is one the branch deleted, instead of resolving the primary\'s copy', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();

  // The primary still holds and links `@scope/gone`; the branch deleted the package but a
  // manifest still declares it. Pointing at the primary would resolve code the branch removed.
  await write(path.join(primaryRoot, 'packages/gone/package.json'), '{"name":"@scope/gone"}');
  await fs.mkdir(path.join(primaryRoot, 'node_modules/@scope'), { recursive: true });
  await fs.symlink('../../packages/gone', path.join(primaryRoot, 'node_modules/@scope/gone'));
  await write(path.join(worktreeRoot, 'packages/app/package.json'), '{"name":"@scope/app","dependencies":{"@scope/gone":"workspace:*"}}');

  await assert.rejects(
    setupWorktree({ directory: worktreeRoot, packageDirectories: ['packages'] }),
    (error: Error) => {
      assert.match(error.message, /packages\/app\/package.json declares @scope\/gone, which only .* own sources resolve/);
      return true;
    },
  );
});

test('links a declared dependency from a primary location the mirror does not cover', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();

  // The package is the branch's own, so its primary-side directory does not exist and nothing
  // nested was mirrored — but the name resolves in the primary partway up the walk.
  await write(path.join(primaryRoot, 'packages/node_modules/dependency/index.js'), '');
  await write(path.join(worktreeRoot, 'packages/app/package.json'), '{"name":"@scope/app","dependencies":{"dependency":"^1.0.0"}}');

  await setupWorktree({ directory: worktreeRoot, packageDirectories: ['packages'] });

  assert.equal(
    await fs.realpath(path.join(worktreeRoot, 'packages/app/node_modules/dependency')),
    path.join(primaryRoot, 'packages/node_modules/dependency'),
  );
});

test('points a copied link that dangles here at the primary checkout', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();

  // What `submodules/<name>` does in these repositories: a relative link out of the
  // checkout, resolving only for one sitting directly beside its target.
  await write(path.join(path.dirname(primaryRoot), 'sibling/packages/config/index.js'), '');
  await fs.mkdir(path.join(primaryRoot, 'submodules'), { recursive: true });
  await fs.symlink('../../sibling', path.join(primaryRoot, 'submodules/sibling'));
  await fs.mkdir(path.join(primaryRoot, 'node_modules/@scope'), { recursive: true });
  await fs.symlink('../../submodules/sibling/packages/config', path.join(primaryRoot, 'node_modules/@scope/config'));

  await setupWorktree({ directory: worktreeRoot, requiredPackages: ['@scope/config'] });

  // The worktree has no `submodules`, so the copied link dangled — and it names a directory
  // outside the checkout, which is the same real one either checkout reaches, so it was
  // repaired.
  assert.equal(
    await fs.realpath(path.join(worktreeRoot, 'node_modules/@scope/config')),
    path.join(path.dirname(primaryRoot), 'sibling/packages/config'),
  );
});

test('leaves a link dangling when the branch is what deleted the package it names', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();

  // Hoisted in the primary, which still has the package; the branch deleted `packages/gone`,
  // so its copy of the link dangles for a reason the primary checkout is not the answer to.
  await write(path.join(primaryRoot, 'packages/gone/index.js'), '');
  await fs.mkdir(path.join(primaryRoot, 'node_modules/@scope'), { recursive: true });
  await fs.symlink('../../packages/gone', path.join(primaryRoot, 'node_modules/@scope/gone'));
  // pnpm gives a workspace package a `.bin` entry through its hoisted link, so repointing
  // that one at the primary would resolve the deleted package's code just as well.
  await fs.mkdir(path.join(primaryRoot, 'node_modules/.bin'), { recursive: true });
  await fs.symlink('../@scope/gone/index.js', path.join(primaryRoot, 'node_modules/.bin/gone'));
  await fs.mkdir(path.join(worktreeRoot, 'packages'), { recursive: true });

  await setupWorktree({ directory: worktreeRoot });

  // Left exactly as it was copied, so it resolves to nothing rather than to the primary's.
  assert.equal(await fs.readlink(path.join(worktreeRoot, 'node_modules/@scope/gone')), '../../packages/gone');
  assert.equal(existsSync(path.join(worktreeRoot, 'node_modules/.bin/gone')), false);
});

test('repairs a link into the primary store, which is nothing a branch adds or deletes', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();

  // What a non-hoisted `nodeLinker` writes: every dependency is a link into `.pnpm`, which
  // `materialize` leaves out on purpose, so the copied link dangles here like any other.
  const store = 'node_modules/.pnpm/dependency@1.0.0/node_modules/dependency';
  await write(path.join(primaryRoot, store, 'index.js'), '');
  await fs.symlink(path.join('.pnpm/dependency@1.0.0/node_modules/dependency'), path.join(primaryRoot, 'node_modules/dependency'));

  await setupWorktree({ directory: worktreeRoot });

  // Inside the primary checkout, but the installed tree rather than the branch's own, so the
  // worktree has nothing of its own to prefer and the primary answers for it.
  assert.equal(await fs.realpath(path.join(worktreeRoot, 'node_modules/dependency')), path.join(primaryRoot, store));
});

test('reports a required package it cannot resolve, without blaming a link that did resolve', async () => {
  const { worktreeRoot } = await checkouts();

  await assert.rejects(
    setupWorktree({ directory: worktreeRoot, requiredPackages: ['@scope/absent'] }),
    (error: Error) => {
      assert.match(error.message, /Cannot resolve @scope\/absent/);
      // Nothing dangled, so where the worktree lives is not the answer: a package that is
      // simply not installed must not send a reader off to move a worktree.
      assert.doesNotMatch(error.message, /git worktree add/);
      assert.doesNotMatch(error.message, /could not be pointed at the primary checkout/);
      return true;
    },
  );
});

test('reports committed links that dangle, which repairing node_modules does not fix', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();
  await fs.mkdir(path.join(worktreeRoot, 'submodules'), { recursive: true });
  await fs.symlink('../../sibling', path.join(worktreeRoot, 'submodules/sibling'));

  await assert.rejects(
    setupWorktree({ directory: worktreeRoot, resolvedLinkDirectories: ['submodules'] }),
    (error: Error) => {
      assert.match(error.message, /submodules\/sibling dangle from here/);
      // Here the location is the answer, so it is said — and says where.
      assert.match(error.message, new RegExp(`git worktree add ${path.join(path.dirname(primaryRoot), '<name>')}`));
      return true;
    },
  );
});

test('reports a copied link it could not repair, alongside what actually failed', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();

  // Dangles in the primary checkout as well — a stale `.bin` entry, the shape this list is
  // made of in practice — so there is nothing to point it at.
  await fs.mkdir(path.join(primaryRoot, 'node_modules/.bin'), { recursive: true });
  await fs.symlink('../removed/bin/removed.js', path.join(primaryRoot, 'node_modules/.bin/removed'));

  await assert.rejects(
    setupWorktree({ directory: worktreeRoot, requiredPackages: ['@scope/absent'] }),
    /1 copied link\(s\) could not be pointed at the primary checkout either/,
  );
});

test('refuses a dependency name that would point its link outside node_modules', async () => {
  const { worktreeRoot } = await checkouts();

  await write(
    path.join(worktreeRoot, 'packages/app/package.json'),
    '{"name":"@scope/app","dependencies":{"../../escapee":"1.0.0"}}',
  );

  await assert.rejects(
    setupWorktree({ directory: worktreeRoot, packageDirectories: ['packages'] }),
    /declares an unusable dependency name/,
  );
});

test('refuses a package name that would point the delete outside node_modules', async () => {
  const { primaryRoot, worktreeRoot } = await checkouts();

  const escapee = path.join(path.dirname(primaryRoot), 'do-not-delete-me');
  await write(path.join(escapee, 'kept.txt'), 'still here');
  await write(
    path.join(worktreeRoot, 'packages/malicious/package.json'),
    JSON.stringify({ name: `../../${path.basename(escapee)}` }),
  );

  await assert.rejects(
    setupWorktree({ directory: worktreeRoot, packageDirectories: ['packages'] }),
    /declares an unusable name/,
  );
  // The point of the guard: `fs.rm` never ran against it.
  assert.equal(existsSync(path.join(escapee, 'kept.txt')), true);
});

test('refuses to run in the primary checkout, whose node_modules it would delete', async () => {
  const { primaryRoot } = await checkouts();

  await assert.rejects(setupWorktree({ directory: primaryRoot }), /is the primary checkout/);
  assert.equal(existsSync(path.join(primaryRoot, 'node_modules')), true);
});
