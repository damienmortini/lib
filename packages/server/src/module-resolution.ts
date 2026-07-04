/**
 * Module-resolution subsystem for the dev server.
 *
 * Owns everything between a bare import specifier and the URL the browser
 * loads: Node-style per-importer resolution (with a package.json fallback for
 * unbuilt dist targets), canonicalization of symlinked paths onto one served
 * URL, the dist→src source mapping, and per-page import-map generation with
 * an installed-package enumeration backing the /@resolve/ on-demand route.
 * Everything anchors on the process working directory (rootDirectory).
 */

import { readdir, readFile, readlink, stat } from 'fs/promises';
import { moduleResolve } from 'import-meta-resolve';
import { dirname, extname, join, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const PACKAGE_EXPORT_CONDITIONS = ['browser', 'import', 'default', 'module', 'require'];
const MODULE_RESOLVE_CONDITIONS = new Set(['module', 'import', 'default']);

export function toPosixPath(path: string): string {
  return path.replaceAll(/\\/g, '/');
}

export const rootDirectory = toPosixPath(`${process.cwd()}/`);
export const importMetaResolveParent = pathToFileURL(rootDirectory);

export type PackageExportConditions = {
  [condition: string]: PackageExportValue;
};

export type PackageExportValue = PackageExportConditions | string | null;

export type PackageJson = {
  exports?: PackageExportConditions;
  main?: string;
  type?: string;
};

export function resolvePackageExportPath(
  exportValue: PackageExportValue | undefined,
  conditions = PACKAGE_EXPORT_CONDITIONS,
  fallbackToNestedValues = true,
): string | undefined {
  if (typeof exportValue === 'string') return exportValue;
  if (exportValue === null || exportValue === undefined) return undefined;

  for (const condition of conditions) {
    const resolvedPath = resolvePackageExportPath(exportValue[condition], conditions, fallbackToNestedValues);
    if (resolvedPath) return resolvedPath;
  }

  if (!fallbackToNestedValues) return undefined;

  for (const nestedExportValue of Object.values(exportValue)) {
    const resolvedPath = resolvePackageExportPath(nestedExportValue, conditions);
    if (resolvedPath) return resolvedPath;
  }

  return undefined;
}

export async function getSourceFilePath(filePath: string): Promise<string | undefined> {
  if (!filePath.includes('/dist/')) return undefined;

  const sourceBaseFilePath = filePath.replace(/\/dist\/(?!.*\/dist\/)/, '/src/');
  const sourceFilePathCandidates = [sourceBaseFilePath];

  if (filePath.endsWith('.js')) {
    sourceFilePathCandidates.unshift(sourceBaseFilePath.replace(/\.js$/, '.ts'));
  }

  for (const sourceFilePathCandidate of sourceFilePathCandidates) {
    const sourceFileMetadata = await stat(sourceFilePathCandidate).catch(() => null);
    if (sourceFileMetadata?.isFile()) {
      return sourceFilePathCandidate;
    }
  }

  return undefined;
}

/**
 * Collapse a resolved module URL onto one canonical served URL.
 *
 * Browsers deduplicate ES modules by URL, so the same package reached through
 * different node_modules symlinks (pnpm links dependencies per consuming
 * package) would evaluate once per URL, and side effects like
 * customElements.define() would throw on the second evaluation. Resolve
 * symlinks component by component, like Node's --preserve-symlinks traversal,
 * keeping a link as-is when its target leaves the served root (e.g. a
 * submodule symlink to a sibling checkout) — a plain realpath would escape
 * the root there.
 */
async function canonicalizeModuleUrl(moduleUrl: URL): Promise<URL> {
  if (!moduleUrl.href.startsWith(importMetaResolveParent.href)) return moduleUrl;

  const modulePath = toPosixPath(fileURLToPath(moduleUrl));
  let currentPath = rootDirectory.slice(0, -1);
  for (const pathComponent of modulePath.slice(rootDirectory.length).split('/')) {
    let candidatePath = `${currentPath}/${pathComponent}`;
    for (let symlinkHopCount = 0; symlinkHopCount < 10; symlinkHopCount++) {
      const symlinkTarget = await readlink(candidatePath).catch(() => null);
      if (symlinkTarget === null) break;
      const resolvedTargetPath = toPosixPath(resolve(dirname(candidatePath), symlinkTarget));
      if (!`${resolvedTargetPath}/`.startsWith(rootDirectory)) break;
      candidatePath = resolvedTargetPath;
    }
    currentPath = candidatePath;
  }
  return pathToFileURL(currentPath);
}

/**
 * Resolve a bare specifier when its build output is missing on disk.
 *
 * Node resolution (and therefore moduleResolve) throws ERR_MODULE_NOT_FOUND when a package's
 * `main`/`exports` target has not been built yet. The server transpiles `dist/*` from `src/*`
 * on the fly, so the path is valid even though the file is absent. Locate the package through
 * its always-present `package.json` and rebuild the module URL without an existence check.
 * The `package.json` lookup walks the `node_modules` chain directly (like Node's package
 * lookup) because resolving `<package>/package.json` through moduleResolve throws
 * ERR_PACKAGE_PATH_NOT_EXPORTED for packages whose `exports` map does not expose it.
 */
async function resolveUnbuiltSpecifier(specifier: string, parentUrl: URL): Promise<URL | undefined> {
  const segments = specifier.split('/');
  const packageName = specifier.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0];
  const subPath = specifier.slice(packageName.length + 1);

  let packageJsonUrl: URL;
  let directoryUrl = new URL('.', parentUrl);
  while (true) {
    const candidateUrl = new URL(`node_modules/${packageName}/package.json`, directoryUrl);
    const candidateStats = await stat(fileURLToPath(candidateUrl)).catch(() => null);
    if (candidateStats?.isFile()) {
      packageJsonUrl = candidateUrl;
      break;
    }
    const parentDirectoryUrl = new URL('..', directoryUrl);
    if (parentDirectoryUrl.href === directoryUrl.href) return undefined;
    directoryUrl = parentDirectoryUrl;
  }

  const packageJson = JSON.parse(await readFile(fileURLToPath(packageJsonUrl), 'utf-8')) as PackageJson;
  const rootExport = typeof packageJson.exports === 'string' ? packageJson.exports : packageJson.exports?.['.'];
  const relativePath = subPath
    ? resolvePackageExportPath(packageJson.exports?.[`./${subPath}`]) ?? subPath
    : resolvePackageExportPath(rootExport) ?? packageJson.main ?? 'index.js';

  return new URL(relativePath, packageJsonUrl);
}

export type ImportMap = {
  imports: { [specifier: string]: string };
  scopes?: { [scopePrefix: string]: { [specifier: string]: string } };
};

const IMPORT_STATEMENT_REGEX = /(?:\bimport\b|\bexport\b)(?:[{\s\w,*$}]*?from)?[\s(]+['"](.*?)['"]/g;
const MODULE_SCRIPT_REGEX = /(<script\b[^>]*\btype\s*=\s*["']module["'][^>]*>)([\s\S]*?)<\/script>/gi;
const CRAWLABLE_EXTENSIONS = new Set(['.js', '.mjs', '.ts']);

// Dummy origin for resolving relative specifiers against served paths.
const SERVED_PATH_BASE = 'http://internal';

// Strip a mount prefix (e.g. `/damo`) from a request path, preserving any query
// string, so file serving and proxy rules work off the origin root. Returns the
// path unchanged when it doesn't fall under the prefix (or no base is set).
export function stripBasePrefix(path: string, basePrefix: string): string {
  if (!basePrefix) return path;
  const queryIndex = path.indexOf('?');
  const pathOnly = queryIndex === -1 ? path : path.slice(0, queryIndex);
  const query = queryIndex === -1 ? '' : path.slice(queryIndex);
  if (pathOnly === basePrefix || pathOnly.startsWith(`${basePrefix}/`)) {
    return (pathOnly.slice(basePrefix.length) || '/') + query;
  }
  return path;
}

// Map a browser-visible path to the file that would be served for it (a
// `dist/*` request is answered from `src/*` when that source exists).
export async function servedPathToSourcePath(servedPath: string, servedRoot: string): Promise<string> {
  const diskPath = join(rootDirectory, stripBasePrefix(servedPath, servedRoot.slice(0, -1)));
  return await getSourceFilePath(diskPath) ?? diskPath;
}

// Resolve a bare specifier from a parent module to its canonical served path,
// or undefined when it cannot be resolved. The optional memo collapses repeat
// canonicalizations of the same resolved URL within one request.
export async function resolveSpecifierToServedPath(
  specifier: string,
  parentUrl: URL,
  servedRoot: string,
  canonicalServedPaths?: Map<string, Promise<string>>,
): Promise<string | undefined> {
  let moduleUrl: URL | undefined;
  try {
    moduleUrl = moduleResolve(specifier, parentUrl, MODULE_RESOLVE_CONDITIONS, true);
  }
  catch {
    moduleUrl = await resolveUnbuiltSpecifier(specifier, parentUrl);
  }
  if (!moduleUrl) return undefined;

  let servedPathPromise = canonicalServedPaths?.get(moduleUrl.href);
  if (!servedPathPromise) {
    // Arrow replacer so `$`-sequences in servedRoot are treated literally, not
    // as String.replace special patterns ($&, $', …).
    servedPathPromise = canonicalizeModuleUrl(moduleUrl)
      .then(canonicalUrl => canonicalUrl.href.replace(importMetaResolveParent.href, () => servedRoot));
    canonicalServedPaths?.set(moduleUrl.href, servedPathPromise);
  }
  return servedPathPromise;
}

/**
 * Build an import map for an HTML page by crawling its module graph.
 *
 * The browser resolves bare specifiers itself through the injected map, so
 * served module bodies are never rewritten. Each module's bare imports are
 * resolved from that module's own location like Node does — pnpm does not
 * hoist transitive dependencies of linked packages into the served root's
 * node_modules — and canonicalized so every package maps to exactly one URL
 * (browsers deduplicate modules by URL). If the same specifier resolves to a
 * different target from some importer, that resolution is scoped to the
 * importer's directory.
 */
export async function buildImportMap(htmlContent: string, pageServedPath: string, servedRoot: string): Promise<ImportMap> {
  const importMap: ImportMap = { imports: {} };
  const scopes: { [scopePrefix: string]: { [specifier: string]: string } } = {};
  const visitedModulePaths = new Set<string>();
  const visitedSourceDirectories = new Set<string>();
  // Many modules import the same package; canonicalize each resolved URL once.
  const canonicalServedPaths = new Map<string, Promise<string>>();
  // Crawl tasks run concurrently and append newly discovered modules as the
  // graph unfolds; the drain loop below picks the additions up, so total crawl
  // time tracks the longest import chain rather than the module count.
  const crawlTasks: Promise<void>[] = [];

  function enqueue(servedModulePath: string): void {
    if (!CRAWLABLE_EXTENSIONS.has(extname(servedModulePath))) return;
    if (visitedModulePaths.has(servedModulePath)) return;
    visitedModulePaths.add(servedModulePath);
    crawlTasks.push(crawlModule(servedModulePath));
  }

  async function crawlModule(servedModulePath: string): Promise<void> {
    const sourceFilePath = await servedPathToSourcePath(servedModulePath, servedRoot);
    visitedSourceDirectories.add(toPosixPath(dirname(sourceFilePath)));
    const content = await readFile(sourceFilePath, { encoding: 'utf-8' }).catch(() => null);
    if (content === null) return;
    await collectImports(content, sourceFilePath, servedModulePath);
  }

  async function collectImports(content: string, importerSourceFilePath: string, importerServedPath: string): Promise<void> {
    const importerBaseUrl = new URL(importerServedPath, SERVED_PATH_BASE);
    const parentUrl = pathToFileURL(importerSourceFilePath);
    await Promise.all(Array.from(content.matchAll(IMPORT_STATEMENT_REGEX), async (match) => {
      const specifier = match[1];
      // Skip full URLs (node:, data:, https:, …) — nothing to map or crawl.
      if (/^[a-z][a-z0-9+.-]*:/i.test(specifier)) return;
      if (/^[./]/.test(specifier)) {
        enqueue(new URL(specifier, importerBaseUrl).pathname);
        return;
      }
      const servedModulePath = await resolveSpecifierToServedPath(specifier, parentUrl, servedRoot, canonicalServedPaths);
      // Leave an unresolvable specifier out of the map so the browser error
      // names the real specifier.
      if (!servedModulePath) {
        console.log(`Unresolvable specifier "${specifier}" imported from ${importerServedPath}`);
        return;
      }
      const mappedPath = importMap.imports[specifier];
      if (mappedPath === undefined) {
        importMap.imports[specifier] = servedModulePath;
      }
      else if (mappedPath !== servedModulePath) {
        // Each importer records its own resolution, so whichever target wins
        // the top-level entry, the others stay correct through their scope.
        const scopePrefix = new URL('.', importerBaseUrl).pathname;
        (scopes[scopePrefix] ??= {})[specifier] = servedModulePath;
      }
      enqueue(servedModulePath);
    }));
  }

  const pageBaseUrl = new URL(pageServedPath, SERVED_PATH_BASE);
  let hasModuleScripts = false;
  let pageSourcePathPromise: Promise<string> | undefined;
  for (const scriptMatch of htmlContent.matchAll(MODULE_SCRIPT_REGEX)) {
    hasModuleScripts = true;
    const sourceAttribute = scriptMatch[1].match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    if (sourceAttribute) {
      enqueue(new URL(sourceAttribute[1], pageBaseUrl).pathname);
    }
    else if (scriptMatch[2]) {
      const inlineScriptBody = scriptMatch[2];
      pageSourcePathPromise ??= servedPathToSourcePath(pageServedPath, servedRoot);
      crawlTasks.push(pageSourcePathPromise
        .then(pageSourceFilePath => collectImports(inlineScriptBody, pageSourceFilePath, pageServedPath)));
    }
  }
  if (!hasModuleScripts) return importMap;

  // Elements pushed while awaiting are still visited: the array iterator
  // re-checks the length on every step.
  for (const crawlTask of crawlTasks) {
    await crawlTask;
  }

  // Import maps have no fallback for unmapped bare specifiers — a dynamic
  // import() of a computed name throws before any network request unless the
  // name is a map key. So every package name installed along the crawled
  // modules' node_modules chains gets an entry; names the crawl did not
  // already map point at the /@resolve/ route, which resolves them
  // server-side at import time. Intentional boundary: a module reached only
  // through /@resolve/ was never crawled, so names visible solely from its
  // own non-hoisted node_modules are not enumerated.
  const pageSourceFilePath = await (pageSourcePathPromise ?? servedPathToSourcePath(pageServedPath, servedRoot));
  visitedSourceDirectories.add(toPosixPath(dirname(pageSourceFilePath)));
  const nodeModulesDirectories = new Set<string>();
  for (const sourceDirectory of visitedSourceDirectories) {
    let currentDirectory = sourceDirectory;
    while (`${currentDirectory}/`.startsWith(rootDirectory)) {
      nodeModulesDirectories.add(`${currentDirectory}/node_modules`);
      currentDirectory = dirname(currentDirectory);
    }
  }
  const installedPackageNames = new Set<string>();
  await Promise.all(Array.from(nodeModulesDirectories, async (nodeModulesDirectory) => {
    const entryNames = await readdir(nodeModulesDirectory).catch((): string[] => []);
    await Promise.all(entryNames.map(async (entryName) => {
      if (entryName.startsWith('.')) return;
      if (entryName.startsWith('@')) {
        for (const scopedName of await readdir(`${nodeModulesDirectory}/${entryName}`).catch((): string[] => [])) {
          if (!scopedName.startsWith('.')) installedPackageNames.add(`${entryName}/${scopedName}`);
        }
      }
      else {
        installedPackageNames.add(entryName);
      }
    }));
  }));
  for (const packageName of installedPackageNames) {
    importMap.imports[packageName] ??= `${servedRoot}@resolve/${packageName}`;
    // Subpath imports (`package/sub`) route through the resolver too.
    importMap.imports[`${packageName}/`] ??= `${servedRoot}@resolve/${packageName}/`;
  }

  if (Object.keys(scopes).length) importMap.scopes = scopes;
  return importMap;
}
