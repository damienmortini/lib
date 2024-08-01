import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

/**
 * @param {Object} object
 * @param {String} [object.scope=$rootScope] Package scope
 * @param {String} [object.name=$rootName] Package name
 * @param {String} [object.path=./packages] Output path
 */
export default async function ({ name, scope, path }) {
  await mkdir(`${path}/${name}`, { recursive: true });
  await mkdir(`${path}/${name}/src`, { recursive: true });

  const { devDependencies } = JSON.parse(
    await readFile(resolve(`${dirname(fileURLToPath(import.meta.url))}/../../../package.json`), 'utf-8'),
  );

  await Promise.all([
    writeFile(
      `${path}/${name}/package.json`,
      JSON.stringify(
        {
          name: `@${scope}/${name}`,
          private: true,
          version: '0.0.0',
          type: 'module',
          main: 'dist/index.js',
          types: 'dist/index.d.ts',
          scripts: {
            build: 'tsc',
          },
          devDependencies: {
            typescript: devDependencies.typescript,
          },
        },
        null,
        2,
      ),
    ),
    writeFile(
      `${path}/${name}/tsconfig.json`,
      JSON.stringify(
        {
          extends: '../../tsconfig.json',
          compilerOptions: {
            outDir: './dist',
          },
          include: ['./src/**/*'],
        },
        null,
        2,
      ),
    ),
    writeFile(`${path}/${name}/.gitignore`, 'node_modules\n/dist'),
    writeFile(`${path}/${name}/src/index.ts`, ''),
  ]);
}
