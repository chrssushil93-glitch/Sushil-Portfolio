'use client';
import { useCallback, useEffect, useState } from 'react';
import './admin.css';

type Tab = 'overview' | 'enquiries' | 'projects' | 'analytics' | 'settings';
async function api(path: string, method = 'GET', body?: any, raw?: FormData) {
  const r = await fetch('/api/admin/' + path, { method, credentials: 'same-origin', headers: raw || body === undefined ? undefined : { 'content-type': 'application/json' }, body: raw || (body === undefined ? undefined : JSON.stringify(body)) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e: any = new Error(j.error || 'Something went wrong'); e.status = r.status; throw e; }
  return j;
}
const when = (s: string) => new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });

async function resizeImage(file: File): Promise<{ blob: Blob; w: number; h: number }> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d')!; g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(bmp, 0, 0, w, h);
  for (const q of [0.9, 0.8, 0.7, 0.55]) {
    const blob: Blob | null = await new Promise(res => c.toBlob(res, 'image/jpeg', q));
    if (blob && blob.size < 3.8 * 1024 * 1024) return { blob, w, h };
  }
  throw new Error('Image is too large even after shrinking.');
}
async function uploadImage(file: File) {
  const { blob, w, h } = await resizeImage(file);
  const f = new FormData(); f.append('file', new File([blob], 'img.jpg', { type: 'image/jpeg' })); f.append('w', String(w)); f.append('h', String(h));
  return api('upload', 'POST', undefined, f) as Promise<{ url: string; w: number; h: number }>;
}

export default function Admin() {
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  useEffect(() => { api('me').then(j => setEmail(j.email)).catch(() => setEmail(null)); }, []);
  if (email === undefined) return <div className="login mute">Loading…</div>;
  if (!email) return <Login onIn={setEmail} />;
  return <Shell email={email} onOut={() => setEmail(null)} />;
}

function Login({ onIn }: { onIn: (e: string) => void }) {
  const [em, setEm] = useState(''), [pw, setPw] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    try { const j = await api('login', 'POST', { email: em, password: pw }); onIn(j.email); } catch (x: any) { setErr(x.message); }
    setBusy(false);
  }
  return (
    <div className="login"><form className="card form" onSubmit={go}>
      <div><div className="brand">Portfolio admin</div><div className="mute small">Sign in to manage your site.</div></div>
      <label className="f">Email<input type="email" autoComplete="username" required value={em} onChange={e => setEm(e.target.value)} /></label>
      <label className="f">Password<input type="password" autoComplete="current-password" required value={pw} onChange={e => setPw(e.target.value)} /></label>
      {err && <div className="msg err" role="alert">{err}</div>}
      <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form></div>
  );
}

function Shell({ email, onOut }: { email: string; onOut: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [newCount, setNewCount] = useState(0);
  const refreshCount = useCallback(() => { api('stats?days=1').then(j => setNewCount(j.totals.newEnquiries)).catch((e) => { if (e.status === 401) onOut(); }); }, [onOut]);
  useEffect(() => { refreshCount(); }, [refreshCount, tab]);
  const tabs: [Tab, string][] = [['overview', 'Overview'], ['enquiries', 'Enquiries'], ['projects', 'Work'], ['analytics', 'Analytics'], ['settings', 'Settings']];
  return (<>
    <div className="top"><div className="wrap">
      <span className="brand">Admin</span>
      <nav className="tabs" aria-label="Sections">{tabs.map(([k, l]) => <button key={k} className="tab" aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>{l}{k === 'enquiries' && newCount > 0 && <span className="badge">{newCount}</span>}</button>)}</nav>
      <a className="btn ghost sm" href="/" target="_blank" rel="noopener">View site</a>
      <button className="btn ghost sm" onClick={async () => { await api('logout', 'POST').catch(() => {}); onOut(); }}>Sign out</button>
    </div></div>
    <main className="wrap">
      {tab === 'overview' && <Overview go={setTab} />}
      {tab === 'enquiries' && <Enquiries onChange={refreshCount} />}
      {tab === 'projects' && <Projects />}
      {tab === 'analytics' && <Analytics />}
      {tab === 'settings' && <Settings email={email} />}
    </main>
  </>);
}

function Overview({ go }: { go: (t: Tab) => void }) {
  const [st, setSt] = useState<any>(null), [enq, setEnq] = useState<any[]>([]), [err, setErr] = useState('');
  useEffect(() => { api('stats?days=30').then(setSt).catch(e => setErr(e.message)); api('enquiries').then(j => setEnq(j.rows.slice(0, 5))).catch(() => {}); }, []);
  if (err) return <div className="msg err">{err}</div>;
  if (!st) return <p className="mute">Loading…</p>;
  const t = st.totals;
  return (<>
    <h1>Overview <span className="mute small">last 30 days</span></h1>
    <div className="grid g4">
      <div className="card stat"><b>{t.view || 0}</b><span>Visits</span></div>
      <div className="card stat"><b>{t.whatsapp || 0}</b><span>WhatsApp taps</span></div>
      <div className="card stat"><b>{t.profile || 0}</b><span>Profile opens</span></div>
      <div className="card stat"><b>{t.enquiries}</b><span>Enquiries</span></div>
    </div>
    <div className="grid g2" style={{ marginTop: '1rem' }}>
      <div className="card"><h2>Visits per day</h2><Bars data={st.series} k="view" /></div>
      <div className="card"><div className="row"><h2 className="sp">Latest enquiries</h2><button className="btn ghost sm" onClick={() => go('enquiries')}>Open inbox</button></div>
        {enq.length === 0 && <p className="mute">No enquiries yet.</p>}
        {enq.map(e => <div key={e.id} className="enq"><div className="row"><b>{e.name || 'No name'}</b><span className="pill">{e.need}</span><span className="sp" /><span className="mute small">{when(e.created_at)}</span></div>{e.details && <p className="small mute">{e.details.slice(0, 140)}</p>}</div>)}
      </div>
    </div>
  </>);
}

function Bars({ data, k, cls }: { data: any[]; k: string; cls?: string }) {
  const max = Math.max(1, ...data.map(d => d[k]));
  return <div className={'bars ' + (cls || '')} role="img" aria-label={`${k} per day`}>{data.map(d => <i key={d.day} title={`${d.day}: ${d[k]}`} style={{ height: Math.max(2, (d[k] / max) * 100) + '%' }} />)}</div>;
}
function Rank({ rows, label }: { rows: { k: string; c: number }[]; label?: (k: string) => string }) {
  const max = Math.max(1, ...rows.map(r => r.c));
  if (!rows.length) return <p className="mute small">No data yet.</p>;
  return <div className="list">{rows.map(r => <div className="li" key={r.k}><span>{label ? label(r.k) : r.k}</span><b>{r.c}</b><div className="bar"><i style={{ width: (r.c / max) * 100 + '%' }} /></div></div>)}</div>;
}

function Analytics() {
  const [days, setDays] = useState(30), [st, setSt] = useState<any>(null), [titles, setTitles] = useState<Record<string, string>>({}), [err, setErr] = useState('');
  useEffect(() => { setSt(null); api('stats?days=' + days).then(setSt).catch(e => setErr(e.message)); }, [days]);
  useEffect(() => { api('projects').then(j => setTitles(Object.fromEntries(j.rows.map((p: any) => [p.slug, p.title])))).catch(() => {}); }, []);
  const cc = (c: string) => { try { return c === '??' ? 'Unknown' : new Intl.DisplayNames(['en'], { type: 'region' }).of(c) || c; } catch { return c; } };
  return (<>
    <div className="row"><h1 className="sp">Analytics</h1>
      <select className="inp" style={{ width: 'auto' }} value={days} onChange={e => setDays(+e.target.value)} aria-label="Range"><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select></div>
    {err && <div className="msg err">{err}</div>}
    {!st ? <p className="mute">Loading…</p> : <div className="stack">
      <div className="grid g4">
        <div className="card stat"><b>{st.totals.view || 0}</b><span>Visits</span></div>
        <div className="card stat"><b>{st.totals.project || 0}</b><span>Piece views</span></div>
        <div className="card stat"><b>{st.totals.whatsapp || 0}</b><span>WhatsApp taps</span></div>
        <div className="card stat"><b>{st.totals.profile || 0}</b><span>Profile opens</span></div>
      </div>
      <div className="grid g2">
        <div className="card"><h2>Visits per day</h2><Bars data={st.series} k="view" /></div>
        <div className="card"><h2>WhatsApp taps per day</h2><Bars data={st.series} k="whatsapp" cls="wa" /></div>
      </div>
      <div className="grid g2">
        <div className="card"><h2>Most viewed pieces</h2><Rank rows={st.projects.map((p: any) => ({ k: p.project, c: p.c }))} label={k => titles[k] || k} /></div>
        <div className="card"><h2>Where visitors come from</h2><Rank rows={st.referrers} /></div>
        <div className="card"><h2>Countries</h2><Rank rows={st.countries} label={cc} /></div>
        <div className="card"><h2>Devices</h2><Rank rows={st.devices} /></div>
      </div>
      <p className="mute small">Visits are counted once per page load. No names, IP addresses or cookies are stored for visitors.</p>
    </div>}
  </>);
}

function Enquiries({ onChange }: { onChange: () => void }) {
  const [rows, setRows] = useState<any[] | null>(null), [f, setF] = useState(''), [err, setErr] = useState('');
  const load = useCallback(() => api('enquiries' + (f ? '?status=' + f : '')).then(j => setRows(j.rows)).catch(e => setErr(e.message)), [f]);
  useEffect(() => { load(); }, [load]);
  async function setStatus(id: number, status: string) { await api('enquiries', 'PATCH', { id, status }); await load(); onChange(); }
  async function del(id: number) { if (!confirm('Delete this enquiry for good?')) return; await api('enquiries?id=' + id, 'DELETE'); await load(); onChange(); }
  return (<>
    <div className="row"><h1 className="sp">Enquiries</h1>
      <select className="inp" style={{ width: 'auto' }} value={f} onChange={e => setF(e.target.value)} aria-label="Filter"><option value="">All</option><option value="new">New</option><option value="read">Read</option><option value="replied">Replied</option><option value="archived">Archived</option></select></div>
    {err && <div className="msg err">{err}</div>}
    <div className="card">
      {!rows ? <p className="mute">Loading…</p> : rows.length === 0 ? <p className="mute">Nothing here yet. Enquiries arrive when someone uses the WhatsApp form on your site.</p> :
        rows.map(e => <div key={e.id} className={'enq ' + (e.status === 'new' ? 'new' : '')}>
          <div className="row"><b>{e.name || 'No name given'}</b><span className="pill">{e.need}</span><span className="pill">{e.status}</span><span className="sp" /><span className="mute small">{when(e.created_at)}</span></div>
          {e.details ? <p>{e.details}</p> : <p className="mute small">No details written.</p>}
          <div className="row">
            {e.status === 'new' && <button className="btn sm" onClick={() => setStatus(e.id, 'read')}>Mark read</button>}
            {e.status !== 'replied' && <button className="btn ghost sm" onClick={() => setStatus(e.id, 'replied')}>Mark replied</button>}
            {e.status !== 'archived' && <button className="btn ghost sm" onClick={() => setStatus(e.id, 'archived')}>Archive</button>}
            <button className="btn danger sm" onClick={() => del(e.id)}>Delete</button>
          </div>
        </div>)}
    </div>
    <p className="mute small">The visitor's WhatsApp message arrives in your WhatsApp app. This inbox is the record of who started a chat and what they asked for.</p>
  </>);
}

type P = { id?: number; title: string; studio: string; description: string; tags: string; image_url: string; image_w: number; image_h: number; video_url: string; visible: boolean };
const blank: P = { title: '', studio: '', description: '', tags: '', image_url: '', image_w: 1000, image_h: 1000, video_url: '', visible: true };

function Projects() {
  const [rows, setRows] = useState<any[] | null>(null), [edit, setEdit] = useState<P | null>(null), [err, setErr] = useState('');
  const load = useCallback(() => api('projects').then(j => setRows(j.rows)).catch(e => setErr(e.message)), []);
  useEffect(() => { load(); }, [load]);
  async function move(i: number, d: number) {
    if (!rows) return; const a = [...rows], j = i + d; if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]]; setRows(a);
    try { await api('projects/reorder', 'POST', { ids: a.map(r => r.id) }); } catch (e: any) { setErr(e.message); load(); }
  }
  async function toggle(r: any) { try { await api('projects/' + r.id, 'PATCH', { ...r, tags: r.tags, visible: !r.visible }); load(); } catch (e: any) { setErr(e.message); } }
  async function del(r: any) { if (!confirm(`Delete "${r.title}"? This cannot be undone.`)) return; await api('projects/' + r.id, 'DELETE'); load(); }
  return (<>
    <div className="row"><h1 className="sp">Work</h1><button className="btn" onClick={() => setEdit({ ...blank })}>Add a piece</button></div>
    <p className="mute small">Order here is the order along the 3D scroll. Changes show on your site within about 30 seconds.</p>
    {err && <div className="msg err">{err}</div>}
    <div className="card">
      {!rows ? <p className="mute">Loading…</p> : rows.map((r, i) => (
        <div key={r.id} className={'item ' + (r.visible ? '' : 'hid')}>
          <img className="thumb" src={r.image_url} alt="" />
          <div style={{ minWidth: 0 }}><b>{r.title}</b>{!r.visible && <span className="pill" style={{ marginLeft: '.5rem' }}>hidden</span>}<div className="mute small">{r.studio}{r.video_url ? ' · video' : ''}</div></div>
          <div className="row acts">
            <button className="btn ghost sm" aria-label={`Move ${r.title} up`} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
            <button className="btn ghost sm" aria-label={`Move ${r.title} down`} disabled={i === rows.length - 1} onClick={() => move(i, 1)}>↓</button>
            <button className="btn ghost sm" onClick={() => toggle(r)}>{r.visible ? 'Hide' : 'Show'}</button>
            <button className="btn ghost sm" onClick={() => setEdit({ ...r, tags: (r.tags || []).join(', '), video_url: r.video_url || '' })}>Edit</button>
            <button className="btn danger sm" onClick={() => del(r)}>Delete</button>
          </div>
        </div>))}
    </div>
    {edit && <ProjectForm p={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />}
  </>);
}

function ProjectForm({ p, onClose, onSaved }: { p: P; onClose: () => void; onSaved: () => void }) {
  const [v, setV] = useState<P>(p), [err, setErr] = useState(''), [busy, setBusy] = useState(false), [up, setUp] = useState(false);
  const set = (k: keyof P, x: any) => setV(s => ({ ...s, [k]: x }));
  async function pick(f?: File) {
    if (!f) return; setUp(true); setErr('');
    try { const r = await uploadImage(f); setV(s => ({ ...s, image_url: r.url, image_w: r.w, image_h: r.h })); } catch (e: any) { setErr(e.message || 'Upload failed'); }
    setUp(false);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    try { await api(v.id ? 'projects/' + v.id : 'projects', v.id ? 'PATCH' : 'POST', v); onSaved(); } catch (x: any) { setErr(x.message); }
    setBusy(false);
  }
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Edit piece" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="card form" onSubmit={save}>
        <div className="row"><h2 className="sp" style={{ margin: 0 }}>{v.id ? 'Edit piece' : 'Add a piece'}</h2><button type="button" className="btn ghost sm" onClick={onClose}>Close</button></div>
        <div>{v.image_url ? <img className="prev" src={v.image_url} alt="" /> : <p className="mute small">No image yet.</p>}
          <label className="f" style={{ marginTop: '.6rem' }}>Image (JPG, PNG, WebP). Large files are shrunk for you.<input type="file" accept="image/*" onChange={e => pick(e.target.files?.[0])} /></label>
          {up && <p className="mute small">Uploading…</p>}</div>
        <label className="f">Title<input required maxLength={120} value={v.title} onChange={e => set('title', e.target.value)} /></label>
        <label className="f">Studio / client<input maxLength={120} value={v.studio} onChange={e => set('studio', e.target.value)} /></label>
        <label className="f">Description<textarea maxLength={600} value={v.description} onChange={e => set('description', e.target.value)} /></label>
        <label className="f">Tags (comma separated)<input value={v.tags} onChange={e => set('tags', e.target.value)} placeholder="Poster design, Key art" /></label>
        <label className="f">Video link (optional, https:// link to an .mp4)<input value={v.video_url} onChange={e => set('video_url', e.target.value)} placeholder="https://…" /></label>
        <label className="chk"><input type="checkbox" checked={v.visible} onChange={e => set('visible', e.target.checked)} />Show on the site</label>
        {err && <div className="msg err" role="alert">{err}</div>}
        <button className="btn" disabled={busy || up || !v.image_url}>{busy ? 'Saving…' : 'Save'}</button>
      </form>
    </div>
  );
}

const FIELDS: [string, string, 'text' | 'area' | 'date'][] = [
  ['name', 'Your name', 'text'], ['role', 'Role', 'text'], ['location', 'Location', 'text'], ['heroEyebrow', 'Line above your name', 'text'],
  ['heroLede', 'Intro under your name', 'area'], ['aboutQuote', 'About quote (wrap a word in *stars* to highlight it)', 'area'], ['contactHeading', 'Contact heading', 'text'],
  ['availableText', 'Availability text', 'text'], ['whatsapp', 'WhatsApp number (country code + number, digits only)', 'text'], ['phone', 'Phone number (as shown after Show)', 'text'],
  ['email', 'Email', 'text'], ['dob', 'Date of birth (only your age is shown)', 'date'], ['languages', 'Languages', 'text'], ['education', 'Education', 'text'],
  ['behanceUrl', 'Behance link', 'text'], ['portfolioUrl', 'Portfolio site link', 'text'],
];
function Settings({ email }: { email: string }) {
  const [s, setS] = useState<any>(null), [msg, setMsg] = useState(''), [err, setErr] = useState(''), [up, setUp] = useState(false);
  useEffect(() => { api('settings').then(j => setS(j.settings)).catch(e => setErr(e.message)); }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg(''); setErr('');
    try { const j = await api('settings', 'PUT', s); setS(j.settings); setMsg('Saved. Your site updates within about 30 seconds.'); } catch (x: any) { setErr(x.message); }
  }
  async function photo(f?: File) {
    if (!f) return; setUp(true); setErr('');
    try { const r = await uploadImage(f); setS((o: any) => ({ ...o, profilePhoto: r.url })); } catch (e: any) { setErr(e.message); }
    setUp(false);
  }
  if (!s) return err ? <div className="msg err">{err}</div> : <p className="mute">Loading…</p>;
  const set = (k: string, v: any) => setS((o: any) => ({ ...o, [k]: v }));
  return (<>
    <h1>Settings</h1>
    <form className="card form" onSubmit={save}>
      <div className="row"><img className="thumb" style={{ borderRadius: '50%' }} src={s.profilePhoto} alt="" /><label className="f sp">Profile photo<input type="file" accept="image/*" onChange={e => photo(e.target.files?.[0])} /></label></div>
      {up && <p className="mute small">Uploading…</p>}
      {FIELDS.map(([k, l, t]) => <label className="f" key={k}>{l}{t === 'area' ? <textarea value={s[k] || ''} onChange={e => set(k, e.target.value)} /> : <input type={t === 'date' ? 'date' : 'text'} value={s[k] || ''} onChange={e => set(k, e.target.value)} />}</label>)}
      <div className="form" style={{ gap: '.5rem' }}>
        {([['available', 'Show "available" badge'], ['showPhone', 'Show mobile number in profile card (hidden until tapped)'], ['showEmail', 'Show email in profile card (hidden until tapped)'], ['showAge', 'Show age in profile card']] as [string, string][]).map(([k, l]) =>
          <label className="chk" key={k}><input type="checkbox" checked={!!s[k]} onChange={e => set(k, e.target.checked)} />{l}</label>)}
      </div>
      {msg && <div className="msg ok" role="status">{msg}</div>}{err && <div className="msg err" role="alert">{err}</div>}
      <div><button className="btn" disabled={up}>Save settings</button></div>
    </form>
    <Password email={email} />
  </>);
}

function Password({ email }: { email: string }) {
  const [cur, setCur] = useState(''), [nx, setNx] = useState(''), [msg, setMsg] = useState(''), [err, setErr] = useState('');
  async function go(e: React.FormEvent) {
    e.preventDefault(); setMsg(''); setErr('');
    try { await api('password', 'POST', { current: cur, next: nx }); setMsg('Password changed.'); setCur(''); setNx(''); } catch (x: any) { setErr(x.message); }
  }
  return (
    <form className="card form" style={{ marginTop: '1.2rem' }} onSubmit={go}>
      <h2>Change password</h2><p className="mute small" style={{ margin: 0 }}>Signed in as {email}</p>
      <label className="f">Current password<input type="password" autoComplete="current-password" value={cur} onChange={e => setCur(e.target.value)} required /></label>
      <label className="f">New password (10+ characters)<input type="password" autoComplete="new-password" minLength={10} value={nx} onChange={e => setNx(e.target.value)} required /></label>
      {msg && <div className="msg ok">{msg}</div>}{err && <div className="msg err">{err}</div>}
      <div><button className="btn">Change password</button></div>
    </form>
  );
}
