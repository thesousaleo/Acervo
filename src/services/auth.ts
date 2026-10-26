import { SUPABASE_KEY, SUPABASE_URL } from './supabase';

/** Login por e-mail e senha (Supabase Auth via REST, sem SDK). */
export interface Session { access_token: string; refresh_token: string; expires_at: number; user: { id: string; email: string } }
const KEY = 'acervo.session';

const read = (): Session | null => { try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null; } catch { return null; } };
const write = (s: Session | null) => { try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY); } catch { /* sem armazenamento */ } };

const AUTH = SUPABASE_URL + '/auth/v1';
const H = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' };

function toSession(d: any): Session {
  return { access_token: d.access_token, refresh_token: d.refresh_token, expires_at: Date.now() + (d.expires_in || 3600) * 1000, user: { id: d.user?.id, email: d.user?.email } };
}
async function explain(r: Response): Promise<Error> {
  let msg = '';
  try { const j = await r.json(); msg = j.msg || j.error_description || j.message || j.error || ''; } catch { /* ignora */ }
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return new Error('E-mail ou senha incorretos.');
  if (m.includes('email not confirmed')) return new Error('Confirme seu e-mail pelo link que enviamos antes de entrar.');
  if (m.includes('already registered')) return new Error('Este e-mail já tem conta. Use "Entrar".');
  if (m.includes('password should be')) return new Error('A senha precisa ter pelo menos 6 caracteres.');
  if (r.status === 429) return new Error('Muitas tentativas. Espere um pouco e tente de novo.');
  return new Error(msg || `Falha na autenticação (${r.status}).`);
}

let listeners: ((s: Session | null) => void)[] = [];
const emit = (s: Session | null) => listeners.forEach(f => f(s));

export const auth = {
  session: read,
  onChange(f: (s: Session | null) => void) { listeners.push(f); return () => { listeners = listeners.filter(x => x !== f); }; },

  async signUp(email: string, password: string): Promise<'confirm' | 'ok'> {
    const r = await fetch(`${AUTH}/signup`, { method: 'POST', headers: H, body: JSON.stringify({ email, password }) });
    if (!r.ok) throw await explain(r);
    const d = await r.json();
    if (d.access_token) { const s = toSession(d); write(s); emit(s); return 'ok'; }
    return 'confirm';
  },
  async signIn(email: string, password: string) {
    const r = await fetch(`${AUTH}/token?grant_type=password`, { method: 'POST', headers: H, body: JSON.stringify({ email, password }) });
    if (!r.ok) throw await explain(r);
    const s = toSession(await r.json()); write(s); emit(s); return s;
  },
  async recover(email: string) {
    const r = await fetch(`${AUTH}/recover`, { method: 'POST', headers: H, body: JSON.stringify({ email }) });
    if (!r.ok) throw await explain(r);
  },
  async signOut() {
    const s = read();
    write(null); emit(null);
    if (s) fetch(`${AUTH}/logout`, { method: 'POST', headers: { ...H, Authorization: `Bearer ${s.access_token}` } }).catch(() => {});
  },
  /** Token válido (renova se estiver perto de expirar). */
  async token(): Promise<string | null> {
    const s = read(); if (!s) return null;
    if (s.expires_at - Date.now() > 60_000) return s.access_token;
    const r = await fetch(`${AUTH}/token?grant_type=refresh_token`, { method: 'POST', headers: H, body: JSON.stringify({ refresh_token: s.refresh_token }) });
    if (!r.ok) { if (r.status === 400 || r.status === 401) { write(null); emit(null); } return null; }
    const n = toSession(await r.json()); write(n); return n.access_token;
  }
};
