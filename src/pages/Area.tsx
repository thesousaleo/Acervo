import { Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Upcoming, upcomingOf } from '../components/Upcoming';
import { CATS, GROUPS, PRI, uniOf } from '../data/catalog';
import { norm } from '../lib/dates';
import { byUpd, sub, uStats } from '../lib/progress';
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
const FILTERS: [string, string][] = [['todos', 'Tudo'], ['concluido', 'Concluídos'], ['consumindo', 'Em andamento'], ['pausado', 'Pausados'], ['abandonado', 'Abandonados'], ['fav', 'Favoritos']];

/** Página de uma área (Filmes & Séries, Jogos ou Livros). */
export function Area({ u }: { u: Universo }) {
  const { items, openEditor } = useLibrary();
  const [q, setQ] = useState('');
  const [f, setF] = useState('todos');
  const [cat, setCat] = useState('todas');
  const [sort, setSort] = useState<Sort>('recentes');
  const [tag, setTag] = useState('');
  const [lista, setLista] = useState('');
  const g = GROUPS[u], s = uStats(items, u);
  const L = items.filter(i => uniOf(i) === u);
  const now = L.filter(i => i.status === 'consumindo').sort(byUpd);
  const fila = L.filter(i => i.status === 'wishlist').sort((a, b) => PRI[b.prioridade || 'Médio'] - PRI[a.prioridade || 'Médio'] || a.titulo.localeCompare(b.titulo, 'pt-BR'));
  const shelfAll = L.filter(i => i.status !== 'wishlist');
  const tags = useMemo(() => [...new Set(L.flatMap(i => [...(i.tags || []), ...(i.generos || [])]))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [L]);
  const listas = useMemo(() => [...new Set(L.flatMap(i => i.listas || []))].sort(), [L]);
  const up = upcomingOf(L, 30);
  const nq = norm(q);
  const shelf = shelfAll.filter(it => (f === 'todos' || (f === 'fav' ? it.favorito : it.status === f))
    && (cat === 'todas' || it.categoria === cat)
    && (!tag || (it.tags || []).includes(tag) || (it.generos || []).includes(tag))
    && (!lista || (it.listas || []).includes(lista))
    && (!nq || norm(it.titulo + ' ' + sub(it)).includes(nq))).sort(SORTS[sort]);

  return (
    <>
      <header className="u-top" style={{ ['--uc' as any]: g.color }}>
        <h1 className="u-title">{g.label}</h1>
        <p className="greet">{g.hello}</p>
        <dl className="figs">
          {s.stats.map(([v, unit, l]) => <div key={l}><dt>{l}</dt><dd>{v}{unit && <small>{unit}</small>}</dd></div>)}
        </dl>
      </header>

      <h2 className="sh">{s.nowLabel}</h2>
      {now.length ? <div className="strip">{now.map(it => <ContItem key={it.id} it={it} />)}</div> : <p className="quiet">Nada em andamento. Escolha algo da fila abaixo.</p>}

      {up.length > 0 && <><h2 className="sh">Próximos episódios</h2><Upcoming list={up} /></>}

      <h2 className="sh">Na fila <span className="n">{fila.length}</span><button className="sh-link" onClick={() => openEditor(null, 'wishlist')}><Plus className="i" aria-hidden />Adicionar</button></h2>
      {fila.length ? <ul className="rows">{fila.map(it => <RowItem key={it.id} it={it} mode="fila" />)}</ul> : <p className="quiet">Sua fila está vazia.</p>}

      <h2 className="sh">Estante <span className="n">{shelfAll.length}</span></h2>
      <div className="tools">
        <label className="find"><Search className="i" aria-hidden /><input type="search" placeholder={g.search} value={q} onChange={e => setQ(e.target.value)} autoComplete="off" aria-label="Buscar" /></label>
        <div className="tabs" role="tablist">
          {FILTERS.map(([k, l]) => <button key={k} role="tab" aria-selected={f === k} className={f === k ? 'on' : ''} onClick={() => setF(k)}>{l}</button>)}
        </div>
        <div className="selects">
          {g.cats.length > 1 && (
            <select className="plain" value={cat} onChange={e => setCat(e.target.value)} aria-label="Tipo">
              <option value="todas">Todos os tipos</option>{g.cats.map(c => <option key={c} value={c}>Só {CATS[c].plural.toLowerCase()}</option>)}
            </select>
          )}
          {tags.length > 0 && <select className="plain" value={tag} onChange={e => setTag(e.target.value)} aria-label="Gênero ou tag"><option value="">Gênero / tag</option>{tags.map(t => <option key={t} value={t}>{t}</option>)}</select>}
          {listas.length > 0 && <select className="plain" value={lista} onChange={e => setLista(e.target.value)} aria-label="Lista"><option value="">Lista</option>{listas.map(t => <option key={t} value={t}>{t}</option>)}</select>}
          <select className="plain" value={sort} onChange={e => setSort(e.target.value as Sort)} aria-label="Ordenar">
            <option value="recentes">Mais recentes</option><option value="nota">Maior nota</option><option value="conclusao">Data de conclusão</option><option value="titulo">Título A–Z</option>
          </select>
        </div>
      </div>
      {shelf.length ? <div className={`shelf g-${u}`}>{shelf.map(it => <ShelfItem key={it.id} it={it} />)}</div> : <p className="quiet">Nada na estante com esses filtros.</p>}
    </>
  );
}
