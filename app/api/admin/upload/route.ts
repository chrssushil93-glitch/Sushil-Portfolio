import { query } from '@/lib/db';
import { admin } from '@/lib/auth';
import { json } from '@/lib/util';

const OK = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
export const POST = admin(async (req) => {
  const f = await req.formData();
  const file = f.get('file');
  if (!(file instanceof File) || !OK.has(file.type)) return json({ error: 'Choose a JPG, PNG, WebP or GIF image.' }, 400);
  if (file.size > 4 * 1024 * 1024) return json({ error: 'Image is over 4 MB. Try a smaller one.' }, 413);
  const buf = Buffer.from(await file.arrayBuffer());
  const dim = (k: string) => Math.min(8000, Math.max(1, parseInt(String(f.get(k) || '')) || 1000));
  const w = dim('w'), h = dim('h');
  const r = await query("insert into media(mime,data,w,h) values($1,decode($2,'hex'),$3,$4) returning id", [file.type, buf.toString('hex'), w, h]);
  return json({ url: `/api/media/${r[0].id}`, w, h });
});
