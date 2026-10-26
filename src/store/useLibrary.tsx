import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { MediaItem, UniversoFiltro } from '../types/media';
import { storage } from '../services/storage';
import { seed } from '../data/seed';
import { uniOf } from '../data/catalog';
import { today } from '../lib/dates';
import { merge } from '../services/backup';
import { supabaseSync } from '../services/sync/supabaseSync';

export type Tab = 'agora' | 'biblioteca' | 'desejos' | 'diario' | 'backup';
export type SyncState = { status: 'off' | 'syncing' | 'ok' | 'error'; at?: number; error?: string };
type SbConfig = { url: string; key: string };

interface Ctx {
  /** itens visíveis (sem os excluídos) */
  items: MediaItem[];
  setItems: (fn: (prev: MediaItem[]) => MediaItem[]) => void;
  tab: Tab; setTab: (t: Tab) => void;
  u: UniversoFiltro; setU: (u: UniversoFiltro) => void;
  inU: (it: MediaItem) => boolean;
  update: (id: string, fn: (it: any) => void, msg?: string) => void;
  upsert: (it: MediaItem) => void;
  remove: (id: string) => void;
  resetSample: () => void;
  toast: (msg: string) => void;
  toastMsg: { id: number; text: string } | null;
  editing: { id: string | null } | null;
  openEditor: (id: string | null) => void;
  closeEditor: () => void;
  sb: SbConfig; setSupabase: (c: SbConfig) => boolean;
  sync: SyncState; syncNow: () => Promise<void>;
}

const LibraryContext = createContext<Ctx | null>(null);
const tomb = (it: MediaItem): MediaItem => ({ ...it, deletedAt: Date.now(), updatedAt: Date.now() });

export function LibraryProvider({ children }: { children: ReactNode }) {
  // "all" inclui marcas de exclusão para que a sincronização propague exclusões.
  const [all, setAll] = useState<MediaItem[]>(() => storage.loadItems());
  const [tab, setTabState] = useState<Tab>('agora');
  const [u, setUState] = useState<UniversoFiltro>(() => storage.loadUniverse());
  const [toastMsg, setToast] = useState<Ctx['toastMsg']>(null);
  const [editing, setEditing] = useState<Ctx['editing']>(null);
  const [sb, setSb] = useState<SbConfig>(() => storage.loadSupabase());
  const [sync, setSync] = useState<SyncState>({ status: sb.url && sb.key ? 'ok' : 'off' });
  const tRef = useRef<number>();
  const allRef = useRef(all); allRef.current = all;
  const fromSync = useRef(false);
  const busy = useRef(false);

  const items = useMemo(() => all.filter(i => !i.deletedAt), [all]);

  useEffect(() => { storage.saveItems(all); }, [all]);
  useEffect(() => { document.documentElement.dataset.u = u; storage.saveUniverse(u); }, [u]);

  const toast = useCallback((text: string) => {
    setToast({ id: Date.now(), text });
    window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  /* ---------- Sincronização (Supabase) ---------- */
  const configured = !!(sb.url && sb.key);
  const syncNow = useCallback(async () => {
    if (!configured || busy.current) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { setSync(s => ({ ...s, status: 'error', error: 'Sem internet' })); return; }
    busy.current = true; setSync(s => ({ ...s, status: 'syncing' }));
    try {
      const p = supabaseSync(sb);
      const remote = await p.pull();
      const merged = merge(allRef.current, remote);
      // envia só o que é diferente do que está no servidor
      const rmap = new Map(remote.map(r => [r.id, r.updatedAt || 0]));
      const changed = merged.filter(m => (rmap.get(m.id) ?? -1) < (m.updatedAt || 0));
      if (changed.length) await p.push(changed);
      fromSync.current = true;
      setAll(merged);
      setSync({ status: 'ok', at: Date.now() });
    } catch (e: any) {
      setSync({ status: 'error', at: Date.now(), error: String(e?.message || e).slice(0, 160) });
    } finally { busy.current = false; }
  }, [configured, sb]);

  // ao abrir o app, ao voltar para ele e quando a internet volta
  useEffect(() => {
    if (!configured) { setSync({ status: 'off' }); return; }
    syncNow();
    const onVis = () => document.visibilityState === 'visible' && syncNow();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', syncNow);
    return () => { document.removeEventListener('visibilitychange', onVis); window.removeEventListener('online', syncNow); };
  }, [configured, syncNow]);

  // depois de cada alteração local (com atraso, para agrupar cliques)
  useEffect(() => {
    if (fromSync.current) { fromSync.current = false; return; }
    if (!configured) return;
    const t = window.setTimeout(syncNow, 2500);
    return () => window.clearTimeout(t);
  }, [all]); // eslint-disable-line react-hooks/exhaustive-deps

  const setSupabase = useCallback((c: SbConfig) => { const ok = storage.saveSupabase(c); setSb(c); return ok; }, []);

  /* ---------- Mutations ---------- */
  const setItems = useCallback((fn: (p: MediaItem[]) => MediaItem[]) => setAll(prevAll => {
    const visible = prevAll.filter(i => !i.deletedAt);
    const next = fn(visible);
    const keep = new Set(next.map(i => i.id));
    const gone = visible.filter(i => !keep.has(i.id)).map(tomb);
    const oldTombs = prevAll.filter(i => i.deletedAt && !keep.has(i.id));
    return [...next, ...gone, ...oldTombs];
  }), []);
  const update = useCallback((id: string, fn: (it: any) => void, msg?: string) => {
    setAll(prev => prev.map(it => {
      if (it.id !== id) return it;
      const c: any = JSON.parse(JSON.stringify(it)); fn(c); c.updatedAt = Date.now(); return c;
    }));
    if (msg) toast(msg);
  }, [toast]);
  const upsert = useCallback((it: MediaItem) => setAll(prev => {
    const i = prev.findIndex(x => x.id === it.id);
    if (i < 0) return [it, ...prev];
    const n = [...prev]; n[i] = it; return n;
  }), []);
  const remove = useCallback((id: string) => setAll(prev => prev.map(x => x.id === id ? tomb(x) : x)), []);
  const resetSample = useCallback(() => setAll(prev => { const S = seed(), ids = new Set(S.map(i => i.id)); return [...S, ...prev.filter(x => !ids.has(x.id)).map(x => x.deletedAt ? x : tomb(x))]; }), []);

  const value = useMemo<Ctx>(() => ({
    items, setItems, tab,
    setTab: (t) => { setTabState(t); window.scrollTo({ top: 0 }); },
    u, setU: (n) => { setUState(n); window.scrollTo({ top: 0 }); },
    inU: (it) => u === 'todos' || uniOf(it) === u,
    update, upsert, remove, resetSample, toast, toastMsg,
    editing, openEditor: (id) => setEditing({ id }), closeEditor: () => setEditing(null),
    sb, setSupabase, sync, syncNow
  }), [items, tab, u, toastMsg, editing, update, upsert, remove, resetSample, toast, setItems, sb, setSupabase, sync, syncNow]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const c = useContext(LibraryContext);
  if (!c) throw new Error('useLibrary fora do LibraryProvider');
  return c;
}

/** Ações rápidas dos cards. */
export function useQuickActions() {
  const { update } = useLibrary();
  return {
    ep: (id: string) => update(id, it => { it.episodioAtual = (+it.episodioAtual || 0) + 1; }, '+1 episódio'),
    hour: (id: string) => update(id, it => { it.horasJogadas = (+it.horasJogadas || 0) + 1; }, '+1 hora registrada'),
    page: (id: string, v: number) => update(id, it => { it.paginaAtual = Math.max(0, it.totalPaginas ? Math.min(v, it.totalPaginas) : v); }, 'Página atualizada'),
    done: (id: string) => update(id, it => {
      it.status = 'concluido'; it.dataConclusao = today();
      if (it.categoria === 'livro' && it.totalPaginas) it.paginaAtual = it.totalPaginas;
      if (it.categoria === 'jogo' && it.nivelConclusao === 'Jogando') it.nivelConclusao = 'História Principal';
    }, 'Concluído hoje · está no Diário'),
    start: (id: string) => update(id, it => { it.status = 'consumindo'; it.dataInicio = today(); delete it.prioridade; }, 'Movido para Consumindo agora')
  };
}
