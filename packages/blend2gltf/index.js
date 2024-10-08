import { execSync } from 'child_process';
import chokidar from 'chokidar';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const directoryName = dirname(fileURLToPath(import.meta.url));

export const blend2gltf = ({
  path = '.',
  watch = false,
}) => {
  // TODO: fix chokidar that doesnt support globs anymore, use fast-glob instead
  const watcher = chokidar.watch(`${path}/**/*.blend`);
  watcher.on('all', (event, path) => {
    execSync(`blender --background ${path} --python "${directoryName}/index.py"`);
    console.log(`${path} exported to GLTF`);
  });
  watcher.on('ready', () => {
    if (!watch) watcher.close();
  });
};
