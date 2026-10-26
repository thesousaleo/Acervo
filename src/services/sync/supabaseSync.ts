import type { Config, MediaItem } from '../../types/media';
import { auth } from '../auth';
import { SUPABASE_KEY, SUPABASE_URL } from '../supabase';

/** Sincronização com o Supabase (REST, com o token do usuário logado). */
const REST = SUPABASE_URL + '/rest/v1';

async function headers() {
  const t = await auth.token();
  if (!t) throw new Error('Entre na sua conta para sincronizar.');
  return { apikey: SUPABASE_KEY, Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' };
}
async function fail(r: Response, what: string) {
  if (r.status === 401 || r.status === 403) return new Error('Sessão expirada. Entre de novo na sua conta.');
  return new Error(`Supabase respondeu ${r.status} ao ${what}.`);
}

export const cloud = {
  async pull(): Promise<MediaItem[]> {
    const r = await fetch(`${REST}/acervo_user_items?select=data`, { headers: await headers() });
    if (!r.ok) throw await fail(r, 'baixar');
    return (await r.json()).map((x: { data: MediaItem }) => x.data);
  },
  async push(items: MediaItem[]) {
    if (!items.length) return;
    const rows = items.map(i => ({ id: i.id, data: i, updated_at: i.updatedAt || Date.now() }));
    for (let i = 0; i < rows.length; i += 200) {
      const r = await fetch(`${REST}/acervo_user_items?on_conflict=user_id,id`, { method: 'POST', headers: { ...(await headers()), Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(rows.slice(i, i + 200)) });
      if (!r.ok) throw await fail(r, 'enviar');
    }
  },
  async pullConfig(): Promise<Config | null> {
    const r = await fetch(`${REST}/acervo_config?select=data`, { headers: await headers() });
    if (!r.ok) throw await fail(r, 'baixar configurações');
    const rows = await r.json();
    return rows[0]?.data || null;
  },
  async pushConfig(c: Config) {
    const r = await fetch(`${REST}/acervo_config?on_conflict=user_id`, { method: 'POST', headers: { ...(await headers()), Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ data: c, updated_at: c.updatedAt }) });
    if (!r.ok) throw await fail(r, 'enviar configurações');
  }
};
