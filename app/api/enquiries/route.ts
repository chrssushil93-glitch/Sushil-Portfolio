import { query } from '@/lib/db';
import { clip, ipHash, json, isBot, sameOrigin } from '@/lib/util';

const NEEDS = ['Poster design', 'Logo design', 'Title or end credits animation', 'Catalogue or cover design', 'Full-time role', 'Something else'];
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req) || isBot(req.headers.get('user-agent'))) return json({ ok: false }, 403);
    const b = await req.json().catch(() => ({}));
    const ip = ipHash(req);
    const recent = await query("select count(*)::int c from enquiries where ip_hash=$1 and created_at > now() - interval '1 hour'", [ip]);
    if (recent[0].c >= 6) return json({ ok: false, error: 'Too many messages. Please try again later.' }, 429);
    const need = NEEDS.includes(b.need) ? b.need : clip(b.need, 60) || 'Something else';
    await query('insert into enquiries(name,need,details,ip_hash) values($1,$2,$3,$4)', [clip(b.name, 80), need, clip(b.details, 1500), ip]);
    return json({ ok: true });
  } catch (e) { console.error('enquiry', e); return json({ ok: false }, 500); }
}
