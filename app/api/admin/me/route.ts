import { currentAdmin } from '@/lib/auth';
import { json } from '@/lib/util';
export async function GET() {
  const a = await currentAdmin().catch(() => null);
  return a ? json({ email: a.email }) : json({ error: 'Not signed in' }, 401);
}
