import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Config, MediaItem, Status, UniversoFiltro } from '../types/media';
import { storage, type Prefs } from '../services/storage';
import { seed } from '../data/seed';
import { GROUPS, purgeGames, uniOf } from '../data/catalog';
import { today } from '../lib/dates';
import { merge } from '../services/backup';
import { cloud } from '../services/sync/supabaseSync';
import { auth, type Session } from '../services/auth';
import { meta } from '../services/meta';
import { scheduleAll } from '../services/notify';

export type Tab = 'inicio' | 'tela' | 'livros' | 'diario' | 'backup';
export type SyncState = { status: 'off' | 'syncing' | 'ok' | 'error'; at?: number; error?: string };
export type ToastMsg = { id: number; text: string; action?: { label: string; run: () => void } };

interface Ctx {
  items: MediaItem[];
  setItems: (fn: (prev: MediaItem[]) => MediaItem[]) => void;
  tab: Tab; setTab: (t: Tab) => void;
  u: UniversoFiltro;
  inU: (it: MediaItem) => boolean;
  update: (id: string, fn: (it: any) => void, msg?: string, action?: ToastMsg['action']) => void;
  patch: (id: string, data: Record<string, any>, touch?: boolean) => void;
  upsert: (it: MediaItem) => void;
  remove: (id: string) => void;
  resetSample: () => void;
  toast: (msg: string, action?: ToastMsg['action']) => void;
  toastMsg: ToastMsg | null;
  editing: { id: string | null; status?: Status } | null;
  openEditor: (id: string | null, status?: Status) => void;
  closeEditor: () => void;
  pageEdit: string | null; setPageEdit: (id: string | null) => void;
  noteFor: string | null; setNoteFor: (id: string | null) => void;
  session: Session | null;
  sync: SyncState; syncNow: () => Promise<void>;
  config: Config; setConfig: (fn: (c: Config) => Config) => void;
  prefs: Prefs; setPrefs: (p: Partial<Prefs>) => void;
}

const LibraryContext = createContext<Ctx | null>(null);
const tomb = (it: MediaItem): MediaItem => ({ ...it, deletedAt: Date.now(), updatedAt: Date.now() });

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [all, setAll] = useState<MediaItem[]>(() => storage.loadItems());
  const [tab, setTabState] = useState<Tab>('inicio');
  const u: UniversoFiltro = tab in GROUPS ? tab as UniversoFiltro : 'todos';
  const [pageEdit, setPageEdit] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [toastMsg, setToast] = useState<ToastMsg | null>(null);
  const [editing, setEditing] = useState<Ctx['editing']>(null);
  const [session, setSession] = useState<Session | null>(() => auth.session());
  const [sync, setSync] = useState<SyncState>({ status: auth.session() ? 'ok' : 'off' });
  const [config, setConfigState] = useState<Config>(() => storage.loadConfig());
  const [prefs, setPrefsState] = useState<Prefs>(() => storage.loadPrefs());
  const tRef = useRef<number>();
  const allRef = useRef(all); allRef.current = all;
  const cfgRef = useRef(config); cfgRef.current = config;
  const fromSync = useRef(false);
  const busy = useRef(false);

  const items = useMemo(() => all.filter(i => !i.deletedAt && (i.categoria as string) !== 'jogo'), [all]);

  useEffect(() => { storage.saveItems(all); }, [all]);
  useEffect(() => { storage.saveConfig(config); }, [config]);
  useEffect(() => { storage.savePrefs(prefs); }, [prefs]);
  useEffect(() => { document.documentElement.dataset.u = u; }, [u]);
  useEffect(() => auth.onChange(setSession), []);

  const toast = useCallback((text: string, action?: ToastMsg['action']) => {
    setToast({ id: Date.now(), text, action });
    window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(() => setToast(null), action ? 4500 : 2400);
  }, []);

  /* ---------- Sincronização ---------- */
  const syncNow = useCallback(async () => {
    if (!auth.session() || busy.current) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { setSync(s => ({ ...s, status: 'error', error: 'Sem internet' })); return; }
    busy.current = true; setSync(s => ({ ...s, status: 'syncing' }));
    try {
      const remote = await cloud.pull();
      const merged = purgeGames(merge(allRef.current, remote));
      const rmap = new Map(remote.map(r => [r.id, r.updatedAt || 0]));
      const changed = merged.filter(m => (rmap.get(m.id) ?? -1) < (m.updatedAt || 0));
      await cloud.push(changed);
      const rc = await cloud.pullConfig();
      const lc = cfgRef.current;
      if (rc && (rc.updatedAt || 0) > (lc.updatedAt || 0)) setConfigState(rc);
      else if (!rc || (lc.updatedAt || 0) > (rc.updatedAt || 0)) await cloud.pushConfig(lc);
      fromSync.current = true;
      setAll(merged);
      setSync({ status: 'ok', at: Date.now() });
    } catch (e: any) {
      setSync({ status: 'error', at: Date.now(), error: String(e?.message || e).slice(0, 160) });
    } finally { busy.current = false; }
  }, []);

  useEffect(() => {
    if (!session) { setSync({ status: 'off' }); return; }
    syncNow();
    const onVis = () => document.visibilityState === 'visible' && syncNow();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', syncNow);
    return () => { document.removeEventListener('visibilitychange', onVis); window.removeEventListener('online', syncNow); };
  }, [session, syncNow]);

  useEffect(() => {
    if (fromSync.current) { fromSync.current = false; return; }
    if (!auth.session()) return;
    const t = window.setTimeout(syncNow, 2500);
    return () => window.clearTimeout(t);
  }, [all, config]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- Atualiza lançamentos e onde assistir (no máximo a cada 12 h) ---------- */
  useEffect(() => {
    if (Date.now() - prefs.lastRefresh < 12 * 3600 * 1000) return;
    const alvo = allRef.current.filter((i: any) => !i.deletedAt && i.ext && ['consumindo', 'wishlist', 'pausado'].includes(i.status) && ['serie', 'anime', 'filme'].includes(i.categoria)).slice(0, 25);
    if (!alvo.length) return;
    (async () => {
      for (const it of alvo) {
        try { const d = await meta.refresh(it); if (d) setAll(prev => prev.map(x => x.id === it.id ? { ...x, ...d } as MediaItem : x)); } catch { /* sem rede ou sem chave: tenta depois */ }
      }
      setPrefsState(p => ({ ...p, lastRefresh: Date.now() }));
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- Notificações (Android) ---------- */
  useEffect(() => {
    const t = window.setTimeout(() => { scheduleAll(items, prefs).catch(() => {}); }, 1500);
    return () => window.clearTimeout(t);
  }, [items, prefs.notifLancamentos, prefs.notifLeitura, prefs.horaLeitura]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- Mutations ---------- */
  const setItems = useCallback((fn: (p: MediaItem[]) => MediaItem[]) => setAll(prevAll => {
    const visible = prevAll.filter(i => !i.deletedAt);
    const next = fn(visible);
    const keep = new Set(next.map(i => i.id));
    const gone = visible.filter(i => !keep.has(i.id)).map(tomb);
    const oldTombs = prevAll.filter(i => i.deletedAt && !keep.has(i.id));
    return [...next, ...gone, ...oldTombs];
  }), []);
  const update = useCallback((id: string, fn: (it: any) => void, msg?: string, action?: ToastMsg['action']) => {
    setAll(prev => prev.map(it => {
      if (it.id !== id) return it;
      const c: any = JSON.parse(JSON.stringify(it)); fn(c); c.updatedAt = Date.now(); return c;
    }));
    if (msg) toast(msg, action);
  }, [toast]);
  const patch = useCallback((id: string, data: Record<string, any>, touch = true) =>
    setAll(prev => prev.map(it => it.id === id ? { ...it, ...data, ...(touch ? { updatedAt: Date.now() } : {}) } as MediaItem : it)), []);
  const upsert = useCallback((it: MediaItem) => setAll(prev => {
    const i = prev.findIndex(x => x.id === it.id);
    if (i < 0) return [it, ...prev];
    const n = [...prev]; n[i] = it; return n;
  }), []);
  const remove = useCallback((id: string) => setAll(prev => prev.map(x => x.id === id ? tomb(x) : x)), []);
  const resetSample = useCallback(() => setAll(prev => { const S = seed(), ids = new Set(S.map(i => i.id)); return [...S, ...prev.filter(x => !ids.has(x.id)).map(x => x.deletedAt ? x : tomb(x))]; }), []);
  const setConfig = useCallback((fn: (c: Config) => Config) => setConfigState(c => ({ ...fn(c), updatedAt: Date.now() })), []);
  const setPrefs = useCallback((p: Partial<Prefs>) => setPrefsState(o => ({ ...o, ...p })), []);

  const value = useMemo<Ctx>(() => ({
    items, setItems, tab,
    setTab: (t) => { setTabState(t); setPageEdit(null); window.scrollTo({ top: 0 }); },
    u, inU: (it) => u === 'todos' || uniOf(it) === u,
    update, patch, upsert, remove, resetSample, toast, toastMsg,
    editing, openEditor: (id, status) => setEditing({ id, status }), closeEditor: () => setEditing(null),
    pageEdit, setPageEdit, noteFor, setNoteFor,
    session, sync, syncNow, config, setConfig, prefs, setPrefs
  }), [items, tab, u, pageEdit, noteFor, toastMsg, editing, update, patch, upsert, remove, resetSample, toast, setItems, session, sync, syncNow, config, setConfig, prefs, setPrefs]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const c = useContext(LibraryContext);
  if (!c) throw new Error('useLibrary fora do LibraryProvider');
  return c;
}

/** Ações rápidas dos cards. Cada uma registra uma sessão no histórico do item. */
export function useQuickActions() {
  const { update, setNoteFor } = useLibrary();
  const log = (it: any, acao: string) => { it.sessoes = [...(it.sessoes || []), { data: today(), ts: Date.now(), acao }].slice(-200); };
  const note = (id: string) => ({ label: 'Anotar', run: () => setNoteFor(id) });
  return {
    ep: (id: string) => update(id, it => {
      if (it.categoria === 'anime') { it.episodioAtual = (+it.episodioAtual || 0) + 1; log(it, `ep. ${it.episodioAtual}`); return; }
      const t: number[] = it.temporadas || [];
      const s = +it.temporadaAtual || 1, e = (+it.episodioAtual || 0) + 1;
      if (t.length && t[s - 1] && e > t[s - 1] && s < t.length) { it.temporadaAtual = s + 1; it.episodioAtual = 1; }
      else it.episodioAtual = e;
      log(it, `T${it.temporadaAtual}E${it.episodioAtual}`);
    }, '+1 episódio', note(id)),
    page: (id: string, v: number) => update(id, it => {
      const isL = it.categoria === 'livro';
      const key = isL ? 'paginaAtual' : 'capituloAtual', tot = isL ? it.totalPaginas : it.totalCapitulos;
      const before = +it[key] || 0;
      it[key] = Math.max(0, tot ? Math.min(v, tot) : v);
      log(it, isL ? `pág. ${before} → ${it[key]}` : `cap. ${before} → ${it[key]}`);
    }, 'Progresso atualizado', note(id)),
    done: (id: string) => update(id, it => {
      it.status = 'concluido'; it.dataConclusao = today();
      if (it.categoria === 'livro' && it.totalPaginas) it.paginaAtual = it.totalPaginas;
      if (it.categoria === 'hq' && it.totalCapitulos) it.capituloAtual = it.totalCapitulos;
      if (it.categoria === 'anime' && it.totalEpisodios) it.episodioAtual = it.totalEpisodios;
      log(it, 'concluído');
    }, 'Concluído hoje · está no Diário'),
    start: (id: string) => update(id, it => { it.status = 'consumindo'; it.dataInicio = today(); delete it.prioridade; log(it, 'começou'); }, 'Movido para em andamento')
  };
}
