import { query } from '@/lib/db';
import { clip, deviceOf, isBot, refHost, json } from '@/lib/util';

const TYPES = new Set(['view', 'project', 'profile', 'whatsapp']);
export async function POST(req: Request) {
  try {
    const ua = req.headers.get('user-agent');
    if (isBot(ua)) return new Response(null, { status: 204 });
    const b = await req.json().catch(() => ({}));
    const type = String(b.type || '');
    if (!TYPES.has(type)) return new Response(null, { status: 204 });
    const ref = type === 'view' ? refHost(req.headers.get('referer'), req.headers.get('host')) : null;
    const country = clip(req.headers.get('x-vercel-ip-country') || '', 2).toUpperCase() || null;
    await query('insert into events(type,path,project,country,device,referrer) values($1,$2,$3,$4,$5,$6)', [type, clip(b.path || '/', 100), b.project ? clip(b.project, 60) : null, country, deviceOf(ua), ref]);
    return new Response(null, { status: 204 });
  } catch (e) { console.error('track', e); return new Response(null, { status: 204 }); }
}
