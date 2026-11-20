import { query } from '@/lib/db';
import { admin } from '@/lib/auth';
import { json } from '@/lib/util';
import { cleanProject } from '@/lib/projects';

export const PATCH = admin(async (req, _who, ctx: { params: Promise<{ id: string }> }) => {
  const id = parseInt((await ctx.params).id);
  const c = cleanProject(await req.json().catch(() => ({})));
  if (!Number.isInteger(id)) return json({ error: 'Bad id' }, 400);
  if (typeof c === 'string') return json({ error: c }, 400);
  const r = await query('update projects set title=$1,studio=$2,description=$3,tags=$4::text[],image_url=$5,image_w=$6,image_h=$7,video_url=$8,visible=$9,updated_at=now() where id=$10 returning *',
    [c.title, c.studio, c.description, c.tags, c.image_url, c.image_w, c.image_h, c.video_url, c.visible, id]);
  return r[0] ? json({ row: r[0] }) : json({ error: 'Not found' }, 404);
});
export const DELETE = admin(async (_req, _who, ctx: { params: Promise<{ id: string }> }) => {
  const id = parseInt((await ctx.params).id);
  if (!Number.isInteger(id)) return json({ error: 'Bad id' }, 400);
  const r = await query('delete from projects where id=$1 returning image_url', [id]);
  const m = /^\/api\/media\/([0-9a-f-]{36})$/i.exec(r[0]?.image_url || '');
  if (m) await query('delete from media where id=$1 and not exists (select 1 from projects where image_url=$2) and not exists (select 1 from settings where value::text like $3)', [m[1], r[0].image_url, '%' + r[0].image_url + '%']);
  return json({ ok: true });
});
