import { mkdir, writeFile } from 'fs/promises'

/**
 * @param {Object} object
 * @param {String} [object.scope=$rootScope] Package scope
 * @param {String} [object.name=$rootName] Package name
 * @param {String} [object.path=./packages] Output path
 */
export default async function ({ name, scope, path }) {
  /** Create path if it doesn't exists */
  await mkdir(path, { recursive: true })

  // await Promise.all([
  //   writeFile(
  //     `${path}/${name}/package.json`,
  //     JSON.stringify(
  //       {
  //         name: `@${scope}/${name}`,
  //         private: true,
  //         version: '0.0.0',
  //         type: 'module',
  //         main: 'dist/index.js',
  //         scripts: {
  //           build: 'tsc',
  //           watch: 'tsc -w',
  //         },
  //         devDependencies: {
  //           typescript: '*',
  //         },
  //       },
  //       null,
  //       2,
  //     ),
  //   ),
  //   writeFile(
  //     `${path}/${name}/tsconfig.json`,
  //     JSON.stringify({
  //       extends: '../../tsconfig.json',
  //       compilerOptions: {
  //         outDir: './dist',
  //       },
  //     }),
  //   ),
  //   writeFile(`${path}/${name}/.gitignore`, 'node_modules\n/dist'),
  //   writeFile(`${path}/${name}/src/index.ts`, ''),
  // ])
}
