import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { requireStaff } from '@/lib/auth';
import { guard, apiError, ApiError } from '@/lib/security';
import { isMock, env } from '@/lib/env';
import { serviceClient } from '@/lib/supabase/server';
export async function POST(request: Request) {
  try {
    await guard(request, 'uploads', 15);
    const user = await requireStaff();
    if (Number(request.headers.get('content-length')) > 9 * 1024 * 1024)
      throw new ApiError(413, 'Images must be under 8 MB.');
    const form = await request.formData(),
      file = form.get('file'),
      bucket = String(form.get('bucket') || 'blog');
    if (!['agents', 'blog', 'neighborhoods', 'listing-photos'].includes(bucket))
      throw new ApiError(400, 'Unknown image bucket.');
    if (user.role === 'agent' && bucket !== 'listing-photos')
      throw new ApiError(
        403,
        'Agents can upload property photography. Shared content is managed by administrators.',
      );
    if (!(file instanceof File) || file.size === 0 || file.size > 8 * 1024 * 1024)
      throw new ApiError(400, 'Choose an image under 8 MB.');
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type))
      throw new ApiError(400, 'Choose a JPEG, PNG, WebP, or AVIF image.');
    const bytes = Buffer.from(await file.arrayBuffer()),
      detected =
        bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
          ? 'image/jpeg'
          : bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
            ? 'image/png'
            : bytes.subarray(0, 4).toString() === 'RIFF' &&
                bytes.subarray(8, 12).toString() === 'WEBP'
              ? 'image/webp'
              : bytes.subarray(4, 8).toString() === 'ftyp' &&
                  /avif|avis/.test(bytes.subarray(8, 40).toString())
                ? 'image/avif'
                : null;
    if (detected !== file.type)
      throw new ApiError(400, 'The image content does not match its file type.');
    const name = randomUUID();
    if (isMock) {
      const dir = path.join(process.cwd(), '.local/media');
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, name), bytes);
      await writeFile(path.join(dir, `${name}.json`), JSON.stringify({ type: detected }));
      return Response.json({ url: `/api/media/${name}` });
    }
    const client = serviceClient();
    const { error } = await client.storage
      .from(bucket)
      .upload(name, bytes, { contentType: detected, upsert: false });
    if (error) throw error;
    return Response.json({
      url: `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${name}`,
    });
  } catch (e) {
    return apiError(e);
  }
}
