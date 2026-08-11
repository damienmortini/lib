import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * Collect the `.gitignore` files governing a directory, outermost first, the way git
 * stacks them. ESLint can be invoked from anywhere — a workspace package that was just
 * touched, for instance — so no ignore file can be assumed to sit in the working
 * directory, and a package's own `.gitignore` must not shadow the repository's.
 * @param {string} startDirectory Absolute directory to search upwards from.
 * @returns {string[]} Absolute ignore file paths, empty when the repository has none.
 */
export function findIgnoreFiles(startDirectory) {
  const ignoreFiles = [];
  for (let directory = startDirectory; ; directory = dirname(directory)) {
    const ignoreFile = join(directory, '.gitignore');
    if (existsSync(ignoreFile)) ignoreFiles.unshift(ignoreFile);
    // Stop at the repository root: a parent repository's patterns govern its own files,
    // not this one's. A filesystem root ends a checkout that has no repository at all.
    if (existsSync(join(directory, '.git')) || dirname(directory) === directory) return ignoreFiles;
  }
}
