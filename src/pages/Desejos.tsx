import { Flame, Plus } from 'lucide-react';
import { useState } from 'react';
import { ORDER, PRI, uniOf } from '../data/catalog';
import { useLibrary } from '../store/useLibrary';
import { WishCard } from '../components/cards/WishCard';
import { UChip, USection } from '../components/Universe';

export function Desejos() {
  const { items, u, inU, openEditor } = useLibrary();
  const [pri, setPri] = useState('todas');
  const all = items.filter(i => i.status === 'wishlist' && inU(i));
  const count = (p: string) => all.filter(i => (i.prioridade || 'Médio') === p).length;
  const L = (pri === 'todas' ? all : all.filter(i => (i.prioridade || 'Médio') === pri))
    .slice().sort((a, b) => PRI[b.prioridade || 'Médio'] - PRI[a.prioridade || 'Médio'] || a.titulo.localeCompare(b.titulo, 'pt-BR'));
  const chips: [string, string, number][] = [['todas', 'Todas', all.length], ['Alto', 'Hype alto', count('Alto')], ['Médio', 'Médio', count('Médio')], ['Baixo', 'Baixo', count('Baixo')]];
  return (
    <>
      <UChip />
      <h1 className="h1">Lista de desejos</h1>
      <p className="lede">O backlog, ordenado pelo hype. “Começar agora” leva o item para o painel e marca hoje como data de início.</p>
      <div className="chips">
        {chips.map(([k, l, c]) => <button key={k} className={`chip ${pri === k ? 'on' : ''}`} onClick={() => setPri(k)}>{k === 'Alto' && <Flame className="i" aria-hidden />}{l}<span className="n">{c}</span></button>)}
      </div>
      {!L.length
        ? <div className="empty glass" style={{ marginTop: 16 }}>Nenhum item com essa prioridade.<button className="btn primary" onClick={() => openEditor(null)}><Plus className="i" aria-hidden />Adicionar desejo</button></div>
        : u === 'todos'
          ? ORDER.map(k => { const S = L.filter(i => uniOf(i) === k); return S.length ? <USection key={k} u={k} meta={`${S.length} na fila`}><div className="wl">{S.map(it => <WishCard key={it.id} it={it} />)}</div></USection> : null; })
          : <div className="wl">{L.map(it => <WishCard key={it.id} it={it} />)}</div>}
    </>
  );
}
