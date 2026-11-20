import { query } from '@/lib/db';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response('Not found', { status: 404 });
  const r = await query("select mime, encode(data,'base64') as b from media where id=$1", [id]);
  if (!r[0]) return new Response('Not found', { status: 404 });
  return new Response(Buffer.from(r[0].b, 'base64'), { headers: { 'content-type': r[0].mime, 'cache-control': 'public, max-age=31536000, immutable' } });
}
