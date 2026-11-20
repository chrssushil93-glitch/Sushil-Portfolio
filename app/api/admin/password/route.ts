import { query } from '@/lib/db';
import { admin, hash, verify, issue } from '@/lib/auth';
import { json } from '@/lib/util';

export const POST = admin(async (req, who) => {
  const b = await req.json().catch(() => ({}));
  const cur = String(b.current || ''), next = String(b.next || '');
  if (next.length < 10) return json({ error: 'New password must be at least 10 characters.' }, 400);
  const r = await query('select password_hash from admins where id=$1', [who.id]);
  if (!r[0] || !(await verify(cur, r[0].password_hash))) return json({ error: 'Current password is wrong.' }, 400);
  const h = await hash(next);
  await query('update admins set password_hash=$1 where id=$2', [h, who.id]);
  await issue({ id: who.id, email: who.email, password_hash: h });
  return json({ ok: true });
});
