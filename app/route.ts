import { renderCurrent } from '@/lib/render';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const host = req.headers.get('x-forwarded-host') || u.host;
    const html = await renderCurrent(`https://${host}`);
    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, s-maxage=30, stale-while-revalidate=300' } });
  } catch (e) {
    console.error('render failed', e);
    return new Response('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="background:#0d0a12;color:#efe7d8;font-family:sans-serif;padding:2rem"><h1>Sushil Chaurasia</h1><p>Portfolio is loading. Please refresh in a moment.</p>', { status: 503, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
  }
}
