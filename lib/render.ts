import { TEMPLATE } from './template';
import { query } from './db';
import { getSettings, Settings } from './settings';
import { esc } from './util';

export type Project = { id: number; slug: string; title: string; studio: string; description: string; tags: string[]; image_url: string; image_w: number; image_h: number; video_url: string | null; sort_order: number; visible: boolean };

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');
const ext = (u: string) => (u || '').replace(/[^\x21-\x7e]/g, '');
const safeUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : '');

export async function visibleProjects(): Promise<Project[]> {
  return (await query('select * from projects where visible order by sort_order, id')) as Project[];
}

export function renderPage(S: Settings, projects: Project[], origin: string): string {
  const parts = S.name.trim().split(/\s+/);
  const h1 = parts.length > 1 ? `<span>${esc(parts[0])}</span><span>${esc(parts.slice(1).join(' '))}</span>` : `<span>${esc(S.name)}</span>`;
  const quote = esc(S.aboutQuote).replace(/\*([^*]+)\*/g, '<em>$1</em>');
  const behance = safeUrl(S.behanceUrl), portfolio = safeUrl(S.portfolioUrl);
  const btn = (u: string, t: string) => (u ? `<a class="btn ghost" href="${esc(u)}" target="_blank" rel="noopener">${t}</a>` : '');
  const mask = S.phone.replace(/\d/g, '•') || '•••••';
  const data = {
    projects: projects.map(p => ({ slug: p.slug, title: p.title, studio: p.studio, description: p.description, tags: p.tags || [], image_url: ext(p.image_url), image_w: p.image_w, image_h: p.image_h, video_url: p.video_url ? ext(p.video_url) : '' })),
    s: { ph: b64(S.phone), wa: b64(S.whatsapp), em: b64(S.email), dob: b64(S.dob) },
    p: { name: S.name, role: S.role, location: S.location, languages: S.languages, education: S.education, available: S.available, availableText: S.availableText, behance, portfolio, photo: ext(S.profilePhoto), showPhone: S.showPhone, showEmail: S.showEmail, showAge: S.showAge },
  };
  const dataJs = JSON.stringify(data).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const tok: Record<string, string> = {
    title: esc(`${S.name} | ${S.role}`), metadesc: esc(S.heroLede), ogimg: esc(origin + (projects[0]?.image_url || S.profilePhoto)),
    name: esc(S.name), eyebrow: esc(S.heroEyebrow), h1, lede: esc(S.heroLede), quote, contactHeading: esc(S.contactHeading), location: esc(S.location),
    avail: S.available ? `<span class="avail"><i></i>${esc(S.availableText)}</span>` : '',
    footAvail: S.available ? `<span>${esc(S.availableText)}</span>` : '',
    behanceBtn: btn(behance, 'Behance'), portfolioBtn: btn(portfolio, 'Full portfolio'), phoneMask: esc(mask),
  };
  return TEMPLATE.replace(/%%(\w+)%%/g, (_, k) => tok[k] ?? '').split('__DATA__').join(dataJs);
}

export async function renderCurrent(origin: string) {
  const [S, P] = await Promise.all([getSettings(), visibleProjects()]);
  return renderPage(S, P, origin);
}
