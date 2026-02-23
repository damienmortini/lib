import type { Format } from 'esbuild';
import fastGlob from 'fast-glob';
import { copyFile, mkdir, readFile, rm, stat, symlink, unlink, writeFile } from 'fs/promises';
import path from 'path';

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
    const allFilePaths = await fastGlob(entryFiles, { ignore });

    if (allFilePaths.length === 0) {
      throw new Error(`No entry files found for ${entryFiles}`);
    }

    const baseDirectory = path.join(
      process.cwd(),
      allFilePaths.reduce((shortest, filePath) => {
        return path.dirname(filePath).length < shortest.length ? path.dirname(filePath) : shortest;
      }, allFilePaths[0]),
    );

    const assetPaths = allFilePaths.filter((filePath) => {
      if (filePath.endsWith('.ts') || filePath.endsWith('.js')) return false;
      if (bundle && filePath.endsWith('.css')) return false;
      return true;
    });

    const entryPoints = allFilePaths.filter((filePath) => {
      return filePath.endsWith('.js') || filePath.endsWith('.ts');
    });

    await Promise.all([
      /**
       * Copy or symlink assets
       */

      (async () => {
        if (assetPaths.length === 0) return;

        if (watch) {
          const chokidar = await import('chokidar');
          chokidar
            .watch(assetPaths, {
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
                catch {}
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
        }
        else {
          await Promise.all(assetPaths.map(async (filePath) => {
            const relativePath = path.relative(baseDirectory, filePath);
            const destinationPath = path.join(outputDirectory, relativePath);
            const isCSSFile = filePath.endsWith('.css');

            // Skip files where destination is newer than source
            try {
              const [srcStat, destStat] = await Promise.all([stat(filePath), stat(destinationPath)]);
              if (destStat.mtimeMs >= srcStat.mtimeMs) return;
            }
            catch {}

            await mkdir(path.dirname(destinationPath), { recursive: true });

            if (isCSSFile) {
              const css = await readFile(filePath, 'utf8');
              const sourceRelativePath = path.relative(path.dirname(destinationPath), filePath).replaceAll('\\', '/');
              const sourceMap = generateCSSSourceMap(css, sourceRelativePath, destinationPath);
              const mapFileName = `${path.basename(destinationPath)}.map`;
              console.log(`[assets] write: ${filePath} → ${destinationPath}`);
              await Promise.all([
                writeFile(destinationPath, `${css}\n/*# sourceMappingURL=${mapFileName} */`),
                writeFile(`${destinationPath}.map`, sourceMap),
              ]);
            }
            else if (copyAssets) {
              console.log(`[assets] copy: ${filePath} → ${destinationPath}`);
              await copyFile(filePath, destinationPath);
            }
            else {
              const absolutePath = path.join(process.cwd(), filePath);
              try {
                await unlink(destinationPath);
              }
              catch {}
              console.log(`[assets] symlink: ${filePath} → ${destinationPath}`);
              try {
                await symlink(absolutePath, destinationPath);
              }
              catch (error) {
                throw new Error(
                  `Symlink failed: if you are on Windows, you may need to enable Developer Mode in Windows settings.\n${error instanceof Error ? error.message : error}`,
                );
              }
            }
          }));
        }
      })(),

      /**
       * Compile TypeScript
       */

      (async () => {
        if (entryPoints.length === 0) return;

        if (!watch) {
          // Find the newest source mtime and oldest output mtime to decide if rebuild is needed
          const newestSrcMtime = (await Promise.all(entryPoints.map(async (p) => {
            try {
              return (await stat(p)).mtimeMs;
            }
            catch {
              return 0;
            }
          }))).reduce((a, b) => Math.max(a, b), 0);

          const outputFiles = await fastGlob(`${outputDirectory}/**/*.{js,mjs}`, { ignore });
          if (outputFiles.length > 0) {
            const oldestDestMtime = (await Promise.all(outputFiles.map(async (p) => {
              try {
                return (await stat(p)).mtimeMs;
              }
              catch {
                return Infinity;
              }
            }))).reduce((a, b) => Math.min(a, b), Infinity);

            if (oldestDestMtime >= newestSrcMtime) {
              console.log('[js] skip: all up to date');
              return;
            }
          }
        }

        const { context } = await import('esbuild');
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
          write: watch,
          logLevel: 'info',
          // external: bundle ? ['*.css'] : undefined,
          plugins: [
            ...(declaration
              ? [
                  {
                    name: 'Emit TypeScript declaration',
                    setup(build) {
                      build.onEnd(async () => {
                        const { fileURLToPath } = await import('url');
                        const { spawn } = await import('child_process');
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
          const result = await ctx.rebuild();
          await ctx.dispose();
          if (result.outputFiles) {
            await Promise.all(result.outputFiles.map(async (outputFile) => {
              try {
                const existing = await readFile(outputFile.path);
                if (Buffer.compare(existing, outputFile.contents) === 0) {
                  console.log(`[js] skip: ${outputFile.path}`);
                  return;
                }
              }
              catch {}
              console.log(`[js] write: ${outputFile.path}`);
              await mkdir(path.dirname(outputFile.path), { recursive: true });
              await writeFile(outputFile.path, outputFile.contents);
            }));
          }
        }
      })(),
    ]);
  }
  catch (error) {
    throw error instanceof Error ? error : new Error(String(error));
  }
};
