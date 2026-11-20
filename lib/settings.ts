import { query } from './db';

export const DEFAULTS = {
  name: 'Sushil Chaurasia', role: 'Graphic / Visual Designer', location: 'Mumbai, India',
  heroEyebrow: 'Graphic & visual designer · Mumbai',
  heroLede: 'Posters, logos, title animation and end credits for series, songs and brands. Plus a 200-page jewellery catalogue.',
  aboutQuote: 'Design is more than looks. It is *story*, feeling and a moment people remember.',
  contactHeading: 'Have a poster, logo or catalogue in mind?',
  available: true, availableText: 'Available full-time',
  whatsapp: '918291920404', phone: '+91 8291920404', email: '', dob: '1995-02-24',
  showPhone: true, showEmail: true, showAge: true,
  languages: 'English, Hindi, Marathi', education: 'Bachelor of Mass Media, University of Mumbai', tools: '',
  behanceUrl: '', portfolioUrl: '', profilePhoto: '/work/me.jpg',
};
export type Settings = typeof DEFAULTS;

export async function getSettings(): Promise<Settings> {
  const r = await query("select value from settings where key='site'");
  return { ...DEFAULTS, ...(r[0]?.value || {}) };
}
export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next: any = { ...(await getSettings()) };
  for (const k of Object.keys(DEFAULTS) as (keyof Settings)[]) {
    if (!(k in patch)) continue;
    const d = DEFAULTS[k], v = (patch as any)[k];
    if (typeof d === 'boolean') next[k] = !!v;
    else next[k] = String(v ?? '').slice(0, k === 'heroLede' || k === 'aboutQuote' ? 600 : 300).trim();
  }
  next.whatsapp = String(next.whatsapp).replace(/\D/g, '');
  await query("insert into settings(key,value) values('site',$1::jsonb) on conflict(key) do update set value=excluded.value", [JSON.stringify(next)]);
  return next;
}
