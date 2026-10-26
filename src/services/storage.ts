import type { Config, MediaItem } from '../types/media';
import { exampleId, seed } from '../data/seed';
import { dedupe } from './backup';

/** Persistência local (offline-first): igual na Web e no APK. */
const KEY = 'acervo.v1';
const CFG = 'acervo.config';
const PREFS = 'acervo.prefs';

export const read = <T,>(k: string): T | null => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) as T : null; } catch { return null; } };
export const write = (k: string, v: unknown): boolean => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

export interface Prefs { notifLancamentos: boolean; notifLeitura: boolean; horaLeitura: string; lastRefresh: number }
const PREFS_DEF: Prefs = { notifLancamentos: true, notifLeitura: false, horaLeitura: '21:00', lastRefresh: 0 };

export const storage = {
  loadItems(): MediaItem[] {
    const p = read<{ items: MediaItem[] }>(KEY);
    if (!p || !Array.isArray(p.items)) return seed();
    const ex = new Set(seed().map(i => i.id));
    return dedupe(p.items.map(i => { const id = exampleId(i.categoria, i.titulo); return !i.id.startsWith('ex-') && ex.has(id) ? { ...i, id } : i; }));
  },
  saveItems(items: MediaItem[]) { write(KEY, { version: 2, items }); },
  loadConfig(): Config { return read<Config>(CFG) || { metas: [], updatedAt: 0 }; },
  saveConfig(c: Config) { write(CFG, c); },
  loadPrefs(): Prefs { return { ...PREFS_DEF, ...(read<Prefs>(PREFS) || {}) }; },
  savePrefs(p: Prefs) { write(PREFS, p); }
};
