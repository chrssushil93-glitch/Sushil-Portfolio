import { query } from '@/lib/db';
import { admin } from '@/lib/auth';
import { json } from '@/lib/util';

export const GET = admin(async (req) => {
  const days = Math.min(365, Math.max(1, parseInt(new URL(req.url).searchParams.get('days') || '30') || 30));
  const [daily, projects, countries, devices, refs, enq, enqNew] = await Promise.all([
    query("select to_char((created_at at time zone 'Asia/Kolkata')::date,'YYYY-MM-DD') as day, type, count(*)::int as c from events where created_at > now() - $1::int * interval '1 day' group by 1,2", [days]),
    query("select project, count(*)::int c from events where type='project' and project is not null and created_at > now() - $1::int * interval '1 day' group by 1 order by 2 desc limit 20", [days]),
    query("select coalesce(country,'??') k, count(*)::int c from events where type='view' and created_at > now() - $1::int * interval '1 day' group by 1 order by 2 desc limit 10", [days]),
    query("select coalesce(device,'?') k, count(*)::int c from events where type='view' and created_at > now() - $1::int * interval '1 day' group by 1 order by 2 desc", [days]),
    query("select coalesce(referrer,'direct') k, count(*)::int c from events where type='view' and created_at > now() - $1::int * interval '1 day' group by 1 order by 2 desc limit 10", [days]),
    query("select count(*)::int c from enquiries where created_at > now() - $1::int * interval '1 day'", [days]),
    query("select count(*)::int c from enquiries where status='new'"),
  ]);
  const map = new Map<string, any>();
  const fmt = (d: Date) => new Date(d.getTime() + 5.5 * 3600e3).toISOString().slice(0, 10);
  for (let i = days - 1; i >= 0; i--) { const k = fmt(new Date(Date.now() - i * 86400e3)); map.set(k, { day: k, view: 0, whatsapp: 0, profile: 0, project: 0 }); }
  const tot = { view: 0, whatsapp: 0, profile: 0, project: 0 } as Record<string, number>;
  for (const r of daily) { const o = map.get(r.day); if (o) o[r.type] += r.c; tot[r.type] = (tot[r.type] || 0) + r.c; }
  return json({ days, totals: { ...tot, enquiries: enq[0].c, newEnquiries: enqNew[0].c }, series: [...map.values()], projects, countries, devices, referrers: refs });
});
