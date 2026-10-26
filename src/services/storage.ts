import type { MediaItem, UniversoFiltro } from '../types/media';
import { exampleId, seed } from '../data/seed';

/**
 * Persistência local (offline-first). Funciona igual na Web e no APK:
 * o WebView do Capacitor guarda o localStorage dentro do app.
 */
const KEY = 'acervo.v1';
const U_KEY = 'acervo.universo';
const SB_KEY = 'acervo.supabase';

const read = <T,>(k: string): T | null => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) as T : null; } catch { return null; } };
const write = (k: string, v: unknown): boolean => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

export const storage = {
  loadItems(): MediaItem[] {
    const p = read<{ items: MediaItem[] }>(KEY);
    if (!p || !Array.isArray(p.items)) return seed();
    // migração: exemplos antigos (id aleatório) passam a usar id fixo
    const ex = new Set(seed().map(i => i.id));
    return p.items.map(i => { const id = exampleId(i.categoria, i.titulo); return !i.id.startsWith('ex-') && ex.has(id) ? { ...i, id } : i; });
  },
  saveItems(items: MediaItem[]) { write(KEY, { version: 1, items }); },
  loadUniverse(): UniversoFiltro {
    const u = read<string>(U_KEY);
    return u === 'tela' || u === 'jogos' || u === 'livros' ? u : 'todos';
  },
  saveUniverse(u: UniversoFiltro) { write(U_KEY, u); },
  loadSupabase(): { url: string; key: string } { return read(SB_KEY) || { url: '', key: '' }; },
  saveSupabase(cfg: { url: string; key: string }) { return write(SB_KEY, cfg); }
};
