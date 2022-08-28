import { fileURLToPath } from 'url'
import { esbuildPlugin } from '@web/dev-server-esbuild'

export default {
  watch: true,
  nodeResolve: true,
  appIndex: 'index.html',
  preserveSymlinks: true,
  plugins: [
    esbuildPlugin({
      ts: true,
      tsconfig: fileURLToPath(new URL('./tsconfig.json', import.meta.url)),
    }),
  ],
}
