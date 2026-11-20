import { neon } from '@neondatabase/serverless';

type Q = (text: string, params?: any[]) => Promise<any[]>;
let q: Q | null = null;
let init: Promise<Q> | null = null;

async function make(): Promise<Q> {
  if (process.env.USE_PGLITE) {
    const mod = '@electric-sql/pglite';
    const { PGlite } = await import(/* webpackIgnore: true */ mod);
    const fs = await import('node:fs');
    const db = new PGlite(process.env.PGLITE_DIR || undefined);
    await db.exec(fs.readFileSync(process.cwd() + '/scripts/schema.sql', 'utf8'));
    const n = await db.query('select count(*)::int c from projects');
    if (!n.rows[0].c) {
      await db.exec(fs.readFileSync(process.cwd() + '/scripts/seed.sql', 'utf8'));
    }
    return async (t, p = []) => (await db.query(t, p)).rows as any[];
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const sql = neon(url);
  return async (t, p = []) => (await sql.query(t, p)) as any[];
}

export async function query(text: string, params: any[] = []): Promise<any[]> {
  if (!q) {
    init = init || make();
    q = await init;
  }
  return q(text, params);
}
