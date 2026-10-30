import { readdir, readFile, writeFile, lstat, rm, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Next 15's Windows tracer joins exclusion globs with backslashes, which can
// leave local records in standalone output. Enforce the boundary on every build.
const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.resolve(root, process.env.NEXT_DIST_DIR || '.next');
const within = (parent, target) => {
  const relative = path.relative(parent, target);
  return (
    relative !== '' &&
    !relative.startsWith(`..${path.sep}`) &&
    relative !== '..' &&
    !path.isAbsolute(relative)
  );
};
if (!within(root, dist)) throw new Error('Build output must remain inside the workspace.');
const standalone = path.join(dist, 'standalone');
await readFile(path.join(dist, 'BUILD_ID'), 'utf8');
await lstat(path.join(standalone, 'server.js'));
const privateDirectories = ['.local', '.lighthouseci', 'test-results', 'playwright-report'];
const isPrivateSource = (file) =>
  privateDirectories.includes(path.relative(root, file).split(path.sep)[0]);
let removed = 0;
async function cleanTraces(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) await cleanTraces(filename);
    else if (entry.isFile() && entry.name.endsWith('.nft.json')) {
      const trace = JSON.parse(await readFile(filename, 'utf8'));
      const files = trace.files.filter((file) => !isPrivateSource(path.resolve(directory, file)));
      if (files.length !== trace.files.length) {
        removed += trace.files.length - files.length;
        await writeFile(filename, JSON.stringify({ ...trace, files }));
      }
    }
  }
}
await cleanTraces(path.join(dist, 'server'));
for (const name of privateDirectories) {
  const target = path.resolve(standalone, name);
  if (!within(standalone, target)) throw new Error('Unsafe standalone cleanup target.');
  try {
    const entry = await lstat(target);
    if (entry.isSymbolicLink()) await unlink(target);
    else await rm(target, { recursive: true, force: true });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
console.log(`Build privacy check passed; excluded ${removed} development-only trace references.`);
