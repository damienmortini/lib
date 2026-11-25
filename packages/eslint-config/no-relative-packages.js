import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

/**
 * Find the package a directory belongs to: the nearest directory, itself included, whose
 * `package.json` names a package. One with no name only says how a folder's files are read
 * (`{ "type": "module" }`), so it is passed over.
 * @param {string} directory Absolute path to start from.
 * @returns {string | null} Absolute path of the package's directory, or null outside any.
 */
function findPackageDirectory(directory) {
  const manifest = join(directory, 'package.json');
  if (existsSync(manifest)) {
    try {
      if (typeof JSON.parse(readFileSync(manifest, 'utf8')).name === 'string') return directory;
    }
    catch {
      // Unreadable as JSON: not a manifest this rule can place a package by.
    }
  }
  const parent = dirname(directory);
  return parent === directory ? null : findPackageDirectory(parent);
}

/**
 * Report an import whose relative path leaves the package of the file it is written in. The
 * other package is imported by its name, through what it exports: a path into it depends on
 * where its files are kept, and on how the two happen to be installed beside each other.
 *
 * Only the path is read, never the file it names, so a `.js` specifier for a `.ts` source
 * counts like any other. `import` and `export … from` are checked; `require()` and a path
 * given to `new URL()` are not, nor is a path into a package nested inside this one.
 * @type {import('eslint').Rule.RuleModule}
 */
export default {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow importing another package by a relative path' },
    messages: { leavesPackage: '"{{specifier}}" leaves this package: import the other package by its name.' },
    schema: [],
  },
  create(context) {
    const directory = dirname(context.physicalFilename);
    const packageDirectory = findPackageDirectory(directory);
    if (packageDirectory === null) return {};

    /**
     * @param {import('estree').Node & { source?: import('estree').Expression | null }} node Import or re-export.
     */
    function check(node) {
      const source = node.source;
      if (source?.type !== 'Literal' || typeof source.value !== 'string' || !/^\.{1,2}(\/|$)/.test(source.value)) return;
      const fromPackage = relative(packageDirectory, resolve(directory, source.value));
      if (fromPackage === '..' || fromPackage.startsWith('../')) {
        context.report({ node: source, messageId: 'leavesPackage', data: { specifier: source.value } });
      }
    }

    return { ImportDeclaration: check, ImportExpression: check, ExportNamedDeclaration: check, ExportAllDeclaration: check };
  },
};
