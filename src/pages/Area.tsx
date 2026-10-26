import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Upcoming, upcomingOf } from '../components/Upcoming';
import { CATS, GROUPS, PRI, uniOf } from '../data/catalog';
import { norm } from '../lib/dates';
import { byUpd, sub } from '../lib/progress';
import { useLibrary } from '../store/useLibrary';
import type { MediaItem, Universo } from '../types/media';
import { ContItem } from '../components/items/ContItem';
import { RowItem } from '../components/items/RowItem';
import { ShelfItem } from '../components/items/ShelfItem';

type Sort = 'recentes' | 'nota' | 'conclusao' | 'titulo';
const SORTS: Record<Sort, (a: MediaItem, b: MediaItem) => number> = {
  recentes: byUpd,
  nota: (a, b) => (b.nota || 0) - (a.nota || 0) || a.titulo.localeCompare(b.titulo, 'pt-BR'),
  conclusao: (a, b) => (b.dataConclusao || '').localeCompare(a.dataConclusao || ''),
  titulo: (a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR')
};
const SORT_L: Record<Sort, string> = { recentes: 'Recentes', nota: 'Maior nota', conclusao: 'Data de conclusão', titulo: 'A–Z' };
const FILTERS: [string, string][] = [['todos', 'Tudo'], ['concluido', 'Concluídos'], ['consumindo', 'Em andamento'], ['pausado', 'Pausados'], ['abandonado', 'Abandonados'], ['fav', 'Favoritos']];
const FILA_VISIVEL = 5;

/** Página de uma área (Filmes & Séries, Jogos ou Livros). */
export function Area({ u }: { u: Universo }) {
  const { items } = useLibrary();
  const [q, setQ] = useState('');
  const [f, setF] = useState('todos');
  const [cat, setCat] = useState('todas');
  const [sort, setSort] = useState<Sort>('recentes');
  const [tag, setTag] = useState('');
  const [lista, setLista] = useState('');
  const [painel, setPainel] = useState(false);
  const [filaToda, setFilaToda] = useState(false);
  const g = GROUPS[u];
  const L = items.filter(i => uniOf(i) === u);
  const now = L.filter(i => i.status === 'consumindo').sort(byUpd);
  const fila = L.filter(i => i.status === 'wishlist').sort((a, b) => PRI[b.prioridade || 'Médio'] - PRI[a.prioridade || 'Médio'] || a.titulo.localeCompare(b.titulo, 'pt-BR'));
  const shelfAll = L.filter(i => i.status !== 'wishlist');
  const tags = useMemo(() => [...new Set(L.flatMap(i => [...(i.tags || []), ...(i.generos || [])]))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [L]);
  const listas = useMemo(() => [...new Set(L.flatMap(i => i.listas || []))].sort(), [L]);
  const up = upcomingOf(L, 30).slice(0, 4);
  const nq = norm(q);
  const shelf = shelfAll.filter(it => (f === 'todos' || (f === 'fav' ? it.favorito : it.status === f))
    && (cat === 'todas' || it.categoria === cat)
    && (!tag || (it.tags || []).includes(tag) || (it.generos || []).includes(tag))
    && (!lista || (it.listas || []).includes(lista))
    && (!nq || norm(it.titulo + ' ' + sub(it)).includes(nq))).sort(SORTS[sort]);
  const ativos = [f !== 'todos', cat !== 'todas', !!tag, !!lista, sort !== 'recentes'].filter(Boolean).length;
  const limpar = () => { setF('todos'); setCat('todas'); setTag(''); setLista(''); setSort('recentes'); };
  const nowLabel = u === 'tela' ? 'Assistindo' : u === 'jogos' ? 'Jogando' : 'Lendo';

  return (
    <>
      <header className="u-top" style={{ ['--uc' as any]: g.color }}>
        <h1 className="u-title">{g.label}</h1>
      </header>

      {now.length > 0 && <><h2 className="sh">{nowLabel} <span className="n">{now.length}</span></h2><div className="strip">{now.map(it => <ContItem key={it.id} it={it} />)}</div></>}
      {up.length > 0 && <><h2 className="sh">Próximos episódios</h2><Upcoming list={up} /></>}

      {fila.length > 0 && (
        <>
          <h2 className="sh">Na fila <span className="n">{fila.length}</span></h2>
          <ul className="rows">{(filaToda ? fila : fila.slice(0, FILA_VISIVEL)).map(it => <RowItem key={it.id} it={it} mode="fila" />)}</ul>
          {fila.length > FILA_VISIVEL && <button className="more" onClick={() => setFilaToda(v => !v)}>{filaToda ? 'Mostrar menos' : `Ver toda a fila (${fila.length})`}</button>}
        </>
      )}

      <h2 className="sh">Estante <span className="n">{shelfAll.length}</span></h2>
      <div className="tools2">
        <label className="find"><Search className="i" aria-hidden /><input type="search" placeholder="Buscar" value={q} onChange={e => setQ(e.target.value)} autoComplete="off" aria-label="Buscar na estante" /></label>
        <button className={`round-btn ${painel || ativos ? 'on' : ''}`} onClick={() => setPainel(p => !p)} aria-expanded={painel} aria-label="Filtros e ordem">
          <SlidersHorizontal className="i" aria-hidden />{ativos > 0 && <span className="badge">{ativos}</span>}
        </button>
      </div>
      {painel && (
        <div className="fpanel">
          <div className="pills">{FILTERS.map(([k, l]) => <button key={k} className={`pill-s ${f === k ? 'on' : ''}`} onClick={() => setF(k)}>{l}</button>)}</div>
          {g.cats.length > 1 && <div className="pills">{(['todas', ...g.cats] as string[]).map(c => <button key={c} className={`pill-s ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{c === 'todas' ? 'Todos os tipos' : CATS[c as keyof typeof CATS].plural}</button>)}</div>}
          <div className="fsel">
            <label><span>Ordem</span><select className="plain" value={sort} onChange={e => setSort(e.target.value as Sort)}>{(Object.keys(SORTS) as Sort[]).map(k => <option key={k} value={k}>{SORT_L[k]}</option>)}</select></label>
            {tags.length > 0 && <label><span>Gênero/tag</span><select className="plain" value={tag} onChange={e => setTag(e.target.value)}><option value="">Todos</option>{tags.map(t => <option key={t} value={t}>{t}</option>)}</select></label>}
            {listas.length > 0 && <label><span>Lista</span><select className="plain" value={lista} onChange={e => setLista(e.target.value)}><option value="">Todas</option>{listas.map(t => <option key={t} value={t}>{t}</option>)}</select></label>}
          </div>
          {ativos > 0 && <button className="more" onClick={limpar}><X className="i" aria-hidden />Limpar filtros</button>}
        </div>
      )}
      {shelf.length ? <div className={`shelf g-${u}`}>{shelf.map(it => <ShelfItem key={it.id} it={it} />)}</div> : <p className="quiet">{shelfAll.length ? 'Nada com esses filtros.' : 'Sua estante está vazia. Toque em + para adicionar.'}</p>}
    </>
  );
}
