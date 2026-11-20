import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { query } from './db';
import { json, sameOrigin } from './util';

const COOKIE = 'adm';
const key = () => {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 24) throw new Error('JWT_SECRET missing or too short');
  return new TextEncoder().encode(s);
};

export async function issue(admin: { id: number; email: string; password_hash: string }) {
  const token = await new SignJWT({ email: admin.email, pv: admin.password_hash.slice(-10) })
    .setProtectedHeader({ alg: 'HS256' }).setSubject(String(admin.id)).setIssuedAt().setExpirationTime('7d').sign(key());
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7 * 86400 });
}
export async function clear() { (await cookies()).delete(COOKIE); }

export async function currentAdmin(): Promise<{ id: number; email: string } | null> {
  try {
    const t = (await cookies()).get(COOKIE)?.value;
    if (!t) return null;
    const { payload } = await jwtVerify(t, key(), { algorithms: ['HS256'] });
    const r = await query('select id,email,password_hash from admins where id=$1', [Number(payload.sub)]);
    const a = r[0];
    if (!a || a.password_hash.slice(-10) !== payload.pv) return null;
    return { id: a.id, email: a.email };
  } catch { return null; }
}

/** wrap an admin route: checks session + same-origin on writes */
export function admin<T extends any[]>(fn: (req: Request, who: { id: number; email: string }, ...rest: T) => Promise<Response>) {
  return async (req: Request, ...rest: T): Promise<Response> => {
    try {
      if (req.method !== 'GET' && !sameOrigin(req)) return json({ error: 'Bad origin' }, 403);
      const who = await currentAdmin();
      if (!who) return json({ error: 'Not signed in' }, 401);
      return await fn(req, who, ...rest);
    } catch (e: any) {
      console.error('admin route', e);
      return json({ error: 'Server error' }, 500);
    }
  };
}
export const hash = (p: string) => bcrypt.hash(p, 11);
export const verify = (p: string, h: string) => bcrypt.compare(p, h);
