import { query } from './db';
import { clip } from './util';

const okUrl = (u: string) => /^(\/[\w\-./]+|https:\/\/\S+)$/.test(u);
export function cleanProject(b: any) {
  const title = clip(b.title, 120);
  if (!title) return 'Title is required.';
  const image_url = clip(b.image_url, 500);
  if (!okUrl(image_url)) return 'Add an image first.';
  const video = clip(b.video_url, 500);
  if (video && !okUrl(video)) return 'Video link must start with https:// or /.';
  const tags = (Array.isArray(b.tags) ? b.tags : String(b.tags || '').split(',')).map((t: any) => clip(t, 40)).filter(Boolean).slice(0, 8);
  const n = (v: any) => Math.min(8000, Math.max(1, parseInt(v) || 1000));
  return { title, studio: clip(b.studio, 120), description: clip(b.description, 600), tags, image_url, image_w: n(b.image_w), image_h: n(b.image_h), video_url: video || null, visible: b.visible !== false };
}
export async function uniqueSlug(title: string) {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'piece';
  let slug = base, i = 2;
  while ((await query('select 1 from projects where slug=$1', [slug])).length) slug = `${base}-${i++}`;
  return slug;
}
