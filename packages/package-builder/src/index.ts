import { spawn } from 'child_process';
import * as chokidar from 'chokidar';
import { context, type Format } from 'esbuild';
import fastGlob from 'fast-glob';
import { copyFile, mkdir, readFile, rm, symlink, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Generate a simple 1:1 CSS source map
 * VLQ: 0='A', 1='C', -1='D'. For identity mapping:
 * - First line: AAAA (col 0, src 0, line 0, col 0)
 * - Next lines: AACA (col 0, src 0, line +1, col 0)
 */
const generateCSSSourceMap = (css: string, sourceFile: string, destFile: string): string => {
  let lineCount = 1;
  for (let i = 0; i < css.length; i++) if (css[i] === '\n') lineCount++;
  const mappings = lineCount === 0 ? '' : 'AAAA' + ';AACA'.repeat(lineCount - 1);

  return JSON.stringify({
    version: 3,
    file: path.basename(destFile),
    sources: [sourceFile],
    sourcesContent: [css],
    mappings,
  });
};

export const build = async ({
  entryFiles = ['src/**'],
  outputDirectory = 'dist',
  watch = false,
  bundle = false,
  minify = false,
  format = 'esm' as Format,
  ignore = ['**/node_modules/**'],
  declaration = false,
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
  declaration?: boolean;
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
            const isCSSFile = filePath.endsWith('.css');

            if (event === 'add') {
              await mkdir(path.dirname(destinationPath), { recursive: true });
            }

            // CSS files: copy with source map for devtools source linking
            if (isCSSFile && (event === 'add' || event === 'change')) {
              const css = await readFile(filePath, 'utf8');
              const sourceRelativePath = path.relative(path.dirname(destinationPath), filePath).replaceAll('\\', '/');
              const sourceMap = generateCSSSourceMap(css, sourceRelativePath, destinationPath);
              const mapFileName = `${path.basename(destinationPath)}.map`;

              await Promise.all([
                writeFile(destinationPath, `${css}\n/*# sourceMappingURL=${mapFileName} */`),
                writeFile(`${destinationPath}.map`, sourceMap),
              ]);
            }
            // Other assets: copy or symlink
            else if (!isCSSFile && copyAssets && (event === 'add' || event === 'change')) {
              await copyFile(filePath, destinationPath);
            }
            else if (!isCSSFile && !copyAssets && event === 'add') {
              const absolutePath = path.join(process.cwd(), filePath);
              try {
                await unlink(destinationPath);
              }
              catch (error) {}
              try {
                await symlink(absolutePath, destinationPath);
              }
              catch (error) {
                throw new Error(
                  `Symlink failed: if you are on Windows, you may need to enable Developer Mode in Windows settings.\n${error instanceof Error ? error.message : error}`,
                );
              }
            }

            if (event === 'unlink') {
              try {
                await unlink(destinationPath);
              }
              catch {}
              if (isCSSFile) {
                try {
                  await unlink(`${destinationPath}.map`);
                }
                catch {}
              }
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
            ...(declaration
              ? [
                  {
                    name: 'Emit TypeScript declaration',
                    setup(build) {
                      build.onEnd(() => {
                        const tscPath = fileURLToPath(import.meta.resolve('typescript/bin/tsc'));
                        const child = spawn(
                          process.execPath,
                          [
                            tscPath,
                            '--declaration',
                            '--declarationMap',
                            '--emitDeclarationOnly',
                            '--skipLibCheck',
                            '--incremental',
                            '--outDir',
                            outputDirectory,
                            ...entryPoints,
                          ],
                          {
                            detached: true,
                            stdio: 'ignore',
                          },
                        );
                        child.on('error', (error) => {
                          console.error(error);
                        });
                        // child.unref();
                      });
                    },
                  },
                ]
              : []),
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
    throw error instanceof Error ? error : new Error(String(error));
  }
};
