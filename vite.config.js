import { defineConfig, loadEnv } from 'vite';
import { auditRequestForNode } from './src/audit-core.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [{
      name: 'local-audit-api',
      configureServer(server) {
        server.middlewares.use('/api/audit', (req, res) => auditRequestForNode(req, res, env));
      },
    }],
  };
});
