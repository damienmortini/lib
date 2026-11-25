import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';

import { RuleTester } from 'eslint';

import noRelativePackages from './no-relative-packages.js';

RuleTester.describe = describe;
RuleTester.it = it;

// Two packages side by side in a workspace. The first holds a folder that only sets its module
// type, and one whose manifest cannot be read.
const root = mkdtempSync(join(tmpdir(), 'no-relative-packages-'));
after(() => rmSync(root, { recursive: true, force: true }));
for (const [directory, manifest] of [
  ['', { name: 'workspace' }],
  ['packages/one', { name: 'one' }],
  ['packages/one/source/commonjs', { type: 'commonjs' }],
  ['packages/one/source/unreadable', '{'],
  ['packages/two', { name: 'two' }],
]) {
  mkdirSync(join(root, directory), { recursive: true });
  writeFileSync(join(root, directory, 'package.json'), typeof manifest === 'string' ? manifest : JSON.stringify(manifest));
}

const inOne = join(root, 'packages/one/source/index.js');
const leavesPackage = specifier => [{ messageId: 'leavesPackage', data: { specifier } }];

new RuleTester().run('no-relative-packages', noRelativePackages, {
  valid: [
    { filename: inOne, code: `import { own } from './own.js';` },
    { filename: inOne, code: `import { own } from '../own.js';` },
    { filename: inOne, code: `import { two } from 'two';` },
    { filename: inOne, code: `import { two } from 'two/source/index.js';` },
    { filename: inOne, code: `const path = '../../two/source/index.js';` },
    { filename: inOne, code: `await import(path);` },
    { filename: inOne, code: `export const own = 1;` },
    { filename: inOne, code: `const own = 1; export { own };` },
    // A manifest with no name, or one that cannot be read, is no package boundary.
    { filename: join(root, 'packages/one/source/commonjs/index.js'), code: `import { own } from '../own.js';` },
    { filename: inOne, code: `import { own } from './commonjs/index.js';` },
    { filename: inOne, code: `import { own } from '../..own.js';` },
    { filename: join(root, 'packages/one/source/unreadable/index.js'), code: `import { own } from '../own.js';` },
  ],
  invalid: [
    { filename: inOne, code: `import { two } from '../../two/source/index.js';`, errors: leavesPackage('../../two/source/index.js') },
    { filename: inOne, code: `import '../../two/source/index.js';`, errors: leavesPackage('../../two/source/index.js') },
    { filename: inOne, code: `const { two } = await import('../../two/source/index.js');`, errors: leavesPackage('../../two/source/index.js') },
    { filename: inOne, code: `export { two } from '../../two/source/index.js';`, errors: leavesPackage('../../two/source/index.js') },
    { filename: inOne, code: `export * from '../../two/source/index.js';`, errors: leavesPackage('../../two/source/index.js') },
    // A file of the workspace's own, above the package.
    { filename: inOne, code: `import { shared } from '../../../shared.js';`, errors: leavesPackage('../../../shared.js') },
    // A dependency reached through where it is installed.
    { filename: inOne, code: `import { build } from '../../../node_modules/three/source/Three.js';`, errors: leavesPackage('../../../node_modules/three/source/Three.js') },
    { filename: join(root, 'packages/one/index.js'), code: `import { parent } from '..';`, errors: leavesPackage('..') },
  ],
});
