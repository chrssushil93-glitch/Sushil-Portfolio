import { query } from '@/lib/db';
import { admin } from '@/lib/auth';
import { json } from '@/lib/util';
import { cleanProject, uniqueSlug } from '@/lib/projects';

export const GET = admin(async () => json({ rows: await query('select * from projects order by sort_order, id') }));
export const POST = admin(async (req) => {
  const c = cleanProject(await req.json().catch(() => ({})));
  if (typeof c === 'string') return json({ error: c }, 400);
  const slug = await uniqueSlug(c.title);
  const max = await query('select coalesce(max(sort_order),0)+1 as n from projects');
  const r = await query('insert into projects(slug,title,studio,description,tags,image_url,image_w,image_h,video_url,visible,sort_order) values($1,$2,$3,$4,$5::text[],$6,$7,$8,$9,$10,$11) returning *',
    [slug, c.title, c.studio, c.description, c.tags, c.image_url, c.image_w, c.image_h, c.video_url, c.visible, max[0].n]);
  return json({ row: r[0] });
});
