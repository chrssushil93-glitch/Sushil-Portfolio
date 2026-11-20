import { query } from '@/lib/db';
import { admin } from '@/lib/auth';
import { json } from '@/lib/util';

const ST = ['new', 'read', 'replied', 'archived'];
export const GET = admin(async (req) => {
  const s = new URL(req.url).searchParams.get('status');
  const rows = s && ST.includes(s)
    ? await query('select id,name,need,details,status,created_at from enquiries where status=$1 order by created_at desc limit 500', [s])
    : await query('select id,name,need,details,status,created_at from enquiries order by created_at desc limit 500');
  return json({ rows });
});
export const PATCH = admin(async (req) => {
  const b = await req.json().catch(() => ({}));
  if (!ST.includes(b.status) || !Number.isInteger(b.id)) return json({ error: 'Bad request' }, 400);
  await query('update enquiries set status=$1 where id=$2', [b.status, b.id]);
  return json({ ok: true });
});
export const DELETE = admin(async (req) => {
  const id = parseInt(new URL(req.url).searchParams.get('id') || '');
  if (!Number.isInteger(id)) return json({ error: 'Bad request' }, 400);
  await query('delete from enquiries where id=$1', [id]);
  return json({ ok: true });
});
