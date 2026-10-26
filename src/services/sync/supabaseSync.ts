import type { MediaItem } from '../../types/media';
import type { SyncProvider } from './SyncProvider';

/**
 * Sincronização via Supabase (REST/PostgREST, sem SDK extra).
 * Tabela esperada (veja README):
 *   create table acervo_items (id text primary key, data jsonb not null, updated_at bigint not null);
 */
export function supabaseSync(cfg: { url: string; key: string }): SyncProvider {
  const base = cfg.url.replace(/\/+$/, '') + '/rest/v1/acervo_items';
  const explain = async (r: Response, what: string) => {
    const body = await r.text();
    if (r.status === 404 || /acervo_items/.test(body) && /does not exist|schema cache/.test(body)) return new Error('Tabela acervo_items não encontrada. Rode o SQL do README no Supabase.');
    if (r.status === 401 || r.status === 403) return new Error('Chave recusada pelo Supabase. Confira a chave e a política da tabela.');
    return new Error(`Supabase respondeu ${r.status} ao ${what}.`);
  };
  // Chaves novas (sb_publishable_…) vão só no header apikey; as antigas (JWT eyJ…) também como Bearer.
  const headers: Record<string, string> = { apikey: cfg.key, 'Content-Type': 'application/json' };
  if (cfg.key.startsWith('eyJ')) headers.Authorization = `Bearer ${cfg.key}`;
  return {
    name: 'supabase',
    isConfigured: () => !!(cfg.url && cfg.key),
    async push(items) {
      const rows = items.map(i => ({ id: i.id, data: i, updated_at: i.updatedAt || Date.now() }));
      const r = await fetch(base + '?on_conflict=id', { method: 'POST', headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(rows) });
      if (!r.ok) throw await explain(r, 'enviar');
    },
    async pull() {
      const r = await fetch(base + '?select=data', { headers });
      if (!r.ok) throw await explain(r, 'baixar');
      const rows: { data: MediaItem }[] = await r.json();
      return rows.map(x => x.data);
    }
  };
}
