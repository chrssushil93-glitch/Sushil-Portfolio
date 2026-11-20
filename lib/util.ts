import { createHash } from 'node:crypto';

export function clientIp(req: Request): string {
  const h = req.headers;
  return (h.get('x-real-ip') || (h.get('x-forwarded-for') || '').split(',')[0] || 'unknown').trim();
}
export function ipHash(req: Request): string {
  return createHash('sha256').update((process.env.IP_SALT || 'salt') + clientIp(req)).digest('hex').slice(0, 24);
}
export function deviceOf(ua: string | null): string {
  const s = ua || '';
  if (/ipad|tablet/i.test(s)) return 'tablet';
  if (/mobi|android|iphone/i.test(s)) return 'mobile';
  return 'desktop';
}
export function isBot(ua: string | null): boolean {
  return /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor|vercel-screenshot/i.test(ua || '');
}
export function refHost(ref: string | null, ownHost: string | null): string {
  if (!ref) return 'direct';
  try {
    const h = new URL(ref).host.replace(/^www\./, '');
    if (ownHost && h === ownHost.replace(/^www\./, '')) return 'direct';
    return h.slice(0, 80);
  } catch { return 'direct'; }
}
export function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
export function clip(v: unknown, n: number): string {
  return String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);
}
export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers } });
}
/** reject cross-site writes (cookie is SameSite=Lax, this is a second layer) */
export function sameOrigin(req: Request): boolean {
  const o = req.headers.get('origin');
  if (!o) return true;
  try { return new URL(o).host === (req.headers.get('x-forwarded-host') || req.headers.get('host')); } catch { return false; }
}
