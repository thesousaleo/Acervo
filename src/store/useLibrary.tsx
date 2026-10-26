import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { MediaItem, UniversoFiltro } from '../types/media';
import { storage } from '../services/storage';
import { seed } from '../data/seed';
import { uniOf } from '../data/catalog';
import { today } from '../lib/dates';

export type Tab = 'agora' | 'biblioteca' | 'desejos' | 'diario' | 'backup';

interface Ctx {
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
}

const LibraryContext = createContext<Ctx | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [items, setItemsState] = useState<MediaItem[]>(() => storage.loadItems());
  const [tab, setTabState] = useState<Tab>('agora');
  const [u, setUState] = useState<UniversoFiltro>(() => storage.loadUniverse());
  const [toastMsg, setToast] = useState<Ctx['toastMsg']>(null);
  const [editing, setEditing] = useState<Ctx['editing']>(null);
  const tRef = useRef<number>();

  useEffect(() => { storage.saveItems(items); }, [items]);
  useEffect(() => { document.documentElement.dataset.u = u; storage.saveUniverse(u); }, [u]);

  const toast = useCallback((text: string) => {
    setToast({ id: Date.now(), text });
    window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  const setItems = useCallback((fn: (p: MediaItem[]) => MediaItem[]) => setItemsState(fn), []);
  const update = useCallback((id: string, fn: (it: any) => void, msg?: string) => {
    setItemsState(prev => prev.map(it => {
      if (it.id !== id) return it;
      const c: any = JSON.parse(JSON.stringify(it)); fn(c); c.updatedAt = Date.now(); return c;
    }));
    if (msg) toast(msg);
  }, [toast]);
  const upsert = useCallback((it: MediaItem) => setItemsState(prev => {
    const i = prev.findIndex(x => x.id === it.id);
    if (i < 0) return [it, ...prev];
    const n = [...prev]; n[i] = it; return n;
  }), []);
  const remove = useCallback((id: string) => setItemsState(prev => prev.filter(x => x.id !== id)), []);
  const resetSample = useCallback(() => setItemsState(seed()), []);

  const value = useMemo<Ctx>(() => ({
    items, setItems, tab,
    setTab: (t) => { setTabState(t); window.scrollTo({ top: 0 }); },
    u, setU: (n) => { setUState(n); window.scrollTo({ top: 0 }); },
    inU: (it) => u === 'todos' || uniOf(it) === u,
    update, upsert, remove, resetSample, toast, toastMsg,
    editing, openEditor: (id) => setEditing({ id }), closeEditor: () => setEditing(null)
  }), [items, tab, u, toastMsg, editing, update, upsert, remove, resetSample, toast, setItems]);

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
