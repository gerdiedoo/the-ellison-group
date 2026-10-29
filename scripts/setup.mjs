import { existsSync, copyFileSync } from 'node:fs';
for (const file of ['.env.development','.env.production']) {
  if (!existsSync(file)) { copyFileSync(`${file}.example`,file); console.log(`Created ${file}`); }
}
console.log('Key-free mock mode is ready. Run pnpm dev, or make dev with Docker Desktop running.');
