import { admin } from '@/lib/auth';
import { json } from '@/lib/util';
import { getSettings, saveSettings } from '@/lib/settings';

export const GET = admin(async () => json({ settings: await getSettings() }));
export const PUT = admin(async (req) => {
  const b = await req.json().catch(() => null);
  if (!b || typeof b !== 'object') return json({ error: 'Bad request' }, 400);
  return json({ settings: await saveSettings(b) });
});
