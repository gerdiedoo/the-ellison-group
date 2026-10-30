import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
const dist = process.env.NEXT_DIST_DIR || '.next';
if (!existsSync(`${dist}/BUILD_ID`)) {
  console.error('Run pnpm build before the production Lighthouse audit.');
  process.exit(1);
}
const child = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3200'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_DIST_DIR: dist,
      MOCK_DATA_FILE: `.local/lighthouse/${randomUUID()}/data.json`,
      AUTH_SECRET: 'isolated-lighthouse-secret-not-for-hosting',
      DEMO_ADMIN_CODE: '',
      AI_GATEWAY_API_KEY: '',
      AI_GATEWAY_MODEL: '',
      DELIVERY_MODE: 'log',
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', (code) => process.exit(code || 0));
