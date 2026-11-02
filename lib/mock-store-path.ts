import path from 'node:path';
import { tmpdir } from 'node:os';

export function mockStorePath(cwd: string, preview: boolean, override?: string) {
  const root = preview ? path.join(tmpdir(), 'ellison-preview-demo') : path.join(cwd, '.local');
  const filename = override ? path.resolve(cwd, override) : path.join(root, 'data.json');
  const relative = path.relative(root, filename);
  if (
    !relative ||
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  )
    throw new Error('MOCK_DATA_FILE must stay inside the demo storage directory.');
  return filename;
}
