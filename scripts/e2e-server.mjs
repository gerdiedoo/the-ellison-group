import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
const run = randomUUID();
const child = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '3100'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_DIST_DIR: '.next-e2e',
      MOCK_DATA_FILE: `.local/e2e/${run}/data.json`,
      NEXT_PUBLIC_APP_ENV: 'development',
      NEXT_PUBLIC_DATA_MODE: 'mock',
      NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3100',
      AUTH_SECRET: 'isolated-e2e-secret-not-for-production-hosting',
      DEMO_ADMIN_CODE: 'qa-admin-code',
      AI_GATEWAY_API_KEY: '',
      AI_GATEWAY_MODEL: '',
      DELIVERY_MODE: 'log',
    },
  },
);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', (code) => process.exit(code || 0));
