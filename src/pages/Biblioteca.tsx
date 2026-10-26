import { Film, Heart, Search, Tv } from 'lucide-react';
import { useState } from 'react';
import { GROUPS, ORDER, STATUS, uniOf } from '../data/catalog';
import { norm } from '../lib/dates';
import { byUpd, sub } from '../lib/progress';
import { useLibrary } from '../store/useLibrary';
import type { MediaItem } from '../types/media';
import { PosterCard } from '../components/cards/PosterCard';
import { UChip, USection } from '../components/Universe';

type Sort = 'recentes' | 'nota' | 'conclusao' | 'titulo';
const SORTS: Record<Sort, (a: MediaItem, b: MediaItem) => number> = {
  recentes: byUpd,
  nota: (a, b) => (b.nota || 0) - (a.nota || 0) || a.titulo.localeCompare(b.titulo, 'pt-BR'),
  conclusao: (a, b) => (b.dataConclusao || '').localeCompare(a.dataConclusao || ''),
  titulo: (a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR')
};

export function Biblioteca() {
  const { items, u, inU } = useLibrary();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<'todas' | 'filme' | 'serie'>('todas');
  const [status, setStatus] = useState<string>('todos');
  const [fav, setFav] = useState(false);
  const [sort, setSort] = useState<Sort>('recentes');
  const nq = norm(q);
  const effCat = u === 'tela' ? cat : 'todas';
  const L = items.filter(it => inU(it) && (effCat === 'todas' || it.categoria === effCat) && (status === 'todos' || it.status === status) && (!fav || it.favorito) && (!nq || norm(it.titulo + ' ' + sub(it)).includes(nq))).sort(SORTS[sort]);
  const total = items.filter(inU).length;
  const n = (x: number) => `${x} ${x === 1 ? 'item' : 'itens'}`;
  const clear = () => { setQ(''); setCat('todas'); setStatus('todos'); setFav(false); };

  return (
    <>
      <UChip />
      <h1 className="h1">Biblioteca</h1>
      <p className="lede">{n(total)} {u === 'todos' ? 'entre filmes, séries, jogos e livros, separados por prateleira' : `em ${GROUPS[u].label}`}.</p>
      <div className="ctrl glass">
        <label className="search"><Search className="i" aria-hidden />
          <input type="search" placeholder={u === 'todos' ? 'Buscar título, autor, diretor, plataforma…' : GROUPS[u].search} value={q} onChange={e => setQ(e.target.value)} autoComplete="off" aria-label="Buscar" />
        </label>
        {u === 'tela' && (
          <div className="chips">
            {([['todas', 'Filmes e séries', null], ['filme', 'Só filmes', Film], ['serie', 'Só séries', Tv]] as const).map(([k, l, Icon]) => (
              <button key={k} className={`chip ${cat === k ? 'on' : ''}`} onClick={() => setCat(k)}>{Icon && <Icon className="i" aria-hidden />}{l}</button>
            ))}
          </div>
        )}
        <div className="row">
          <select className="in" value={status} onChange={e => setStatus(e.target.value)} aria-label="Status">
            <option value="todos">Todos os status</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="in" value={sort} onChange={e => setSort(e.target.value as Sort)} aria-label="Ordenar">
            <option value="recentes">Mais recentes</option><option value="nota">Maior nota</option><option value="conclusao">Data de conclusão</option><option value="titulo">Título A–Z</option>
          </select>
          <button className={`chip ${fav ? 'on' : ''}`} aria-pressed={fav} onClick={() => setFav(f => !f)}><Heart className={fav ? 'i fill' : 'i'} aria-hidden />Favoritos</button>
        </div>
      </div>
      {!L.length
        ? <div className="empty glass">Nada encontrado com esses filtros.<button className="btn" onClick={clear}>Limpar filtros</button></div>
        : u === 'todos'
          ? ORDER.map(k => { const S = L.filter(i => uniOf(i) === k); return S.length ? <USection key={k} u={k} meta={n(S.length)}><div className={`grid g-${k}`}>{S.map(it => <PosterCard key={it.id} it={it} />)}</div></USection> : null; })
          : <><p className="count">{n(L.length)}</p><div className={`grid g-${u}`}>{L.map(it => <PosterCard key={it.id} it={it} />)}</div></>}
    </>
  );
}
