import { clear } from '@/lib/auth';
import { json, sameOrigin } from '@/lib/util';
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: 'Bad origin' }, 403);
  await clear();
  return json({ ok: true });
}
