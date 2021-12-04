import chokidar from 'chokidar'
import { execSync } from 'child_process'

import { fileURLToPath } from 'url'
import { dirname } from 'path'

const directoryName = dirname(fileURLToPath(import.meta.url))

export const blend2gltf = ({
  path = '.',
  watch = false,
}) => {
  const watcher = chokidar.watch(`${path}/**/*.blend`)
  watcher.on('all', (event, path) => {
    execSync(`blender --background ${path} --python "${directoryName}/index.py"`)
    console.log(`${path} exported to GLTF`)
  })
  watcher.on('ready', () => {
    if (!watch) watcher.close()
  })
}
