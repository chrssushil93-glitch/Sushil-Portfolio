import { query } from '@/lib/db';
import { admin } from '@/lib/auth';
import { json } from '@/lib/util';

export const POST = admin(async (req) => {
  const b = await req.json().catch(() => ({}));
  const ids: number[] = Array.isArray(b.ids) ? b.ids.map(Number).filter(Number.isInteger) : [];
  if (!ids.length || ids.length > 500) return json({ error: 'Bad request' }, 400);
  await query('update projects p set sort_order=o.ord from (select unnest($1::int[]) as id, generate_series(1,$2::int) as ord) o where p.id=o.id', [ids, ids.length]);
  return json({ ok: true });
});
