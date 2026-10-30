import { revalidatePath } from 'next/cache';
import { requireStaff } from '@/lib/auth';
import { guard, body, apiError } from '@/lib/security';
import { platformSnapshot } from '@/lib/platform/snapshot';
import { platformCommand } from '@/lib/platform/commands';
export async function GET() {
  try {
    return Response.json(await platformSnapshot(await requireStaff()), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    const user = await requireStaff();
    await guard(request, 'platform', 90);
    const result = await platformCommand(user, await body(request, 256000));
    revalidatePath('/', 'layout');
    return Response.json(result);
  } catch (error) {
    return apiError(error);
  }
}
