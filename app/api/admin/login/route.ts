import { query } from '@/lib/db';
import { issue, verify } from '@/lib/auth';
import { ipHash, json, sameOrigin, clip } from '@/lib/util';

export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) return json({ error: 'Bad origin' }, 403);
    const ip = ipHash(req);
    const n = await query("select count(*)::int c from login_attempts where ip_hash=$1 and created_at > now() - interval '15 minutes'", [ip]);
    if (n[0].c >= 8) return json({ error: 'Too many attempts. Try again in 15 minutes.' }, 429);
    const b = await req.json().catch(() => ({}));
    const email = clip(b.email, 200).toLowerCase(), pw = String(b.password || '').slice(0, 200);
    const r = await query('select id,email,password_hash from admins where lower(email)=$1', [email]);
    const a = r[0];
    const ok = a ? await verify(pw, a.password_hash) : (await verify(pw, '$2b$11$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi'), false);
    if (!ok) {
      await query('insert into login_attempts(ip_hash) values($1)', [ip]);
      return json({ error: 'Wrong email or password.' }, 401);
    }
    await issue(a);
    return json({ ok: true, email: a.email });
  } catch (e) { console.error('login', e); return json({ error: 'Server error' }, 500); }
}
