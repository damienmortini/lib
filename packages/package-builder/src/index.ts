import { spawn } from 'child_process';
import * as chokidar from 'chokidar';
import { context, type Format } from 'esbuild';
import fastGlob from 'fast-glob';
import { copyFile, mkdir, readFile, rm, symlink, unlink } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

export const build = async ({
  entryFiles = ['src/**'],
  outputDirectory = 'dist',
  watch = false,
  bundle = false,
  minify = false,
  format = 'esm' as Format,
  ignore = ['**/node_modules/**'],
  noDeclaration = false,
  copyAssets = false,
  platform = 'browser',
}: {
  entryFiles?: string[];
  outputDirectory?: string;
  watch?: boolean;
  bundle?: boolean;
  minify?: boolean;
  format?: Format;
  ignore?: string[];
  noDeclaration?: boolean;
  copyAssets?: boolean;
  platform?: 'node' | 'browser';
} = {}) => {
  try {
    const filePaths = await fastGlob(entryFiles, { ignore });

    if (filePaths.length === 0) {
      throw new Error(`No entry files found for ${entryFiles}`);
    }

    const baseDirectory = path.join(
      process.cwd(),
      filePaths.reduce((shortest, filePath) => {
        return path.dirname(filePath).length < shortest.length ? path.dirname(filePath) : shortest;
      }, filePaths[0]),
    );

    await Promise.all([
      /**
       * Copy or symlink assets
       */

      (async () => {
        const paths = await fastGlob([...entryFiles, ...['!**/*.ts', '!**/*.js'], ...(bundle ? ['!**/*.css'] : [])], { ignore });

        if (paths.length === 0) return;

        const assetsWatcher = chokidar
          .watch(paths, {
            ignoreInitial: false,
            ignored: ignore,
          })
          .on('all', async (event, filePath) => {
            const relativePath = path.relative(baseDirectory, filePath);
            const destinationPath = path.join(outputDirectory, relativePath);

            if (event === 'add') {
              await mkdir(path.dirname(destinationPath), { recursive: true });
            }

            if (copyAssets && (event === 'add' || event === 'change')) {
              await copyFile(filePath, destinationPath);
            }

            if (!copyAssets && event === 'add') {
              const absolutePath = path.join(process.cwd(), filePath);
              try {
                await unlink(destinationPath);
              }
              catch (error) {}
              try {
                await symlink(absolutePath, destinationPath);
              }
              catch (error) {
                throw new Error(`Symlink failed: if you are on Windows, you may need to enable Developer Mode in Windows settings.\n${error.message}`);
              }
            }

            if (event === 'unlink') {
              await unlink(destinationPath);
            }

            if (event === 'unlinkDir') {
              await rm(destinationPath, { recursive: true });
            }
          });

        if (!watch) {
          await new Promise<void>((resolve) => {
            assetsWatcher.on('ready', () => resolve());
          });
          await assetsWatcher.close();
        }
      })(),

      /**
       * Compile TypeScript
       */
      (async () => {
        const entryPaths = await fastGlob(entryFiles, {
          ignore,
          objectMode: true,
          cwd: process.cwd(),
        });

        const entryPoints = entryPaths
          .filter((entryPath) => {
            return entryPath.path.endsWith('.js') || entryPath.path.endsWith('.ts');
            // return entryPath.path.endsWith('.js') || entryPath.path.endsWith('.ts') || entryPath.path.endsWith('.css');
          })
          .map(entry => entry.path);

        const ctx = await context({
          entryPoints,
          bundle,
          minify,
          platform,
          // splitting: true,
          preserveSymlinks: true,
          format,
          sourcemap: true,
          target: 'esnext',
          outdir: outputDirectory,
          logLevel: 'info',
          // external: bundle ? ['*.css'] : undefined,
          plugins: [
            ...(noDeclaration
              ? []
              : [{
                  name: 'Emit TypeScript declaration',
                  setup(build) {
                    build.onEnd(() => {
                      const tscPath = fileURLToPath(import.meta.resolve('typescript/bin/tsc'));
                      const child = spawn(process.execPath, [
                        tscPath,
                        '--declaration',
                        '--declarationMap',
                        '--emitDeclarationOnly',
                        '--skipLibCheck',
                        '--incremental',
                        '--outDir',
                        outputDirectory,
                        ...entryPoints,
                      ], {
                        detached: true,
                        stdio: 'ignore',
                      });
                      child.on('error', (error) => {
                        console.error(error);
                      });
                      // child.unref();
                    });
                  },
                }]),
            ...(bundle
              ? [
                  {
                    name: 'CSS Import Assertions',
                    setup(build) {
                      build.onLoad({ filter: /\.css$/ }, async (args) => {
                        const css = await readFile(args.path, 'utf8');
                        const contents = `
const styles = new CSSStyleSheet();
styles.replaceSync(\`${css.replaceAll(/[`$]/gm, '\\$&')}\`);
export default styles;`;
                        return { contents };
                      });
                    },
                  },
                ]
              : []),
          ],
        });

        console.log('Building...');

        if (watch) {
          await ctx.watch();
        }
        else {
          await ctx.rebuild();
          await ctx.dispose();
        }
      })(),
    ]);
  }
  catch (error) {
    throw new Error(error);
  }
};
