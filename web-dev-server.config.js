import { esbuildPlugin } from '@web/dev-server-esbuild';
import { fileURLToPath } from 'url';

export default {
  watch: true,
  nodeResolve: true,
  appIndex: 'index.html',
  preserveSymlinks: true,
  http2: true,
  sslKey: fileURLToPath(new URL('./packages/server/server.key', import.meta.url)),
  sslCert: fileURLToPath(new URL('./packages/server/server.crt', import.meta.url)),
  plugins: [
    esbuildPlugin({
      ts: true,
      tsconfig: fileURLToPath(new URL('./tsconfig.json', import.meta.url)),
    }),
  ],
};
