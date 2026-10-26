import type { MediaItem } from '../../types/media';
import type { SyncProvider } from './SyncProvider';

/**
 * Sincronização via Supabase (REST/PostgREST, sem SDK extra).
 * Tabela esperada (veja README):
 *   create table acervo_items (id text primary key, data jsonb not null, updated_at bigint not null);
 */
export function supabaseSync(cfg: { url: string; key: string }): SyncProvider {
  const base = cfg.url.replace(/\/+$/, '') + '/rest/v1/acervo_items';
  const headers = { apikey: cfg.key, Authorization: `Bearer ${cfg.key}`, 'Content-Type': 'application/json' };
  return {
    name: 'supabase',
    isConfigured: () => !!(cfg.url && cfg.key),
    async push(items) {
      const rows = items.map(i => ({ id: i.id, data: i, updated_at: i.updatedAt || Date.now() }));
      const r = await fetch(base + '?on_conflict=id', { method: 'POST', headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(rows) });
      if (!r.ok) throw new Error(`Supabase respondeu ${r.status} ao enviar: ${await r.text()}`);
    },
    async pull() {
      const r = await fetch(base + '?select=data', { headers });
      if (!r.ok) throw new Error(`Supabase respondeu ${r.status} ao baixar: ${await r.text()}`);
      const rows: { data: MediaItem }[] = await r.json();
      return rows.map(x => x.data);
    }
  };
}
