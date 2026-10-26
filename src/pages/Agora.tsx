import { Bookmark } from 'lucide-react';
import { GROUPS, ORDER, uniOf } from '../data/catalog';
import { Pause } from 'lucide-react';
import { byDone, byUpd, progress, uStats } from '../lib/progress';
import { useLibrary } from '../store/useLibrary';
import type { Universo } from '../types/media';
import { NowCard } from '../components/cards/NowCard';
import { PosterCard } from '../components/cards/PosterCard';
import { UChip, USection } from '../components/Universe';
import { GROUP_ICON } from '../components/icons';

export function Agora() {
  const { items, u, setU, setTab } = useLibrary();
  const h = new Date().getHours();
  const hello = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';

  if (u === 'todos') {
    const nowAll = items.filter(i => i.status === 'consumindo').length;
    return (
      <>
        <h1 className="h1">{hello}. Isto é o que está rolando.</h1>
        <p className="lede">{nowAll} {nowAll === 1 ? 'item' : 'itens'} em andamento, separados por tipo. Toque num bloco para ver só aquele universo.</p>
        <div className="u-tiles">
          {ORDER.map(k => {
            const g = GROUPS[k], s = uStats(items, k), Icon = GROUP_ICON[k];
            return (
              <button key={k} className="u-card" style={{ ['--uc' as any]: g.color }} onClick={() => setU(k)}>
                <span className="u-ic"><Icon className="i" aria-hidden /></span>
                <span className="u-name">{g.label}</span>
                <b>{s.now}<small>{s.nowLabel.toLowerCase()}</small></b>
                <span className="u-foot">{s.foot}</span>
              </button>
            );
          })}
        </div>
        {ORDER.map(k => <NowSection key={k} u={k} />)}
      </>
    );
  }

  const g = GROUPS[u], s = uStats(items, u);
  const L = items.filter(i => uniOf(i) === u);
  const now = L.filter(i => i.status === 'consumindo').sort(byUpd);
  const paused = L.filter(i => i.status === 'pausado').sort(byUpd);
  const recent = L.filter(i => i.status === 'concluido').sort(byDone).slice(0, 6);
  return (
    <>
      <UChip />
      <h1 className="h1">{g.hello}</h1>
      <p className="lede">{now.length ? 'Use os atalhos do card para registrar progresso sem abrir nada.' : 'Nada em andamento por aqui.'}</p>
      <div className="stats">
        {s.stats.map(([v, unit, l]) => <div key={l} className="stat glass"><b>{v}{unit && <small style={{ fontSize: 16 }}> {unit}</small>}</b><span>{l}</span></div>)}
      </div>
      <h2 className="sec-h">{s.nowLabel} <small>{now.length}</small></h2>
      {now.length
        ? <div className="now-grid">{now.map(it => <NowCard key={it.id} it={it} />)}</div>
        : <div className="empty glass">Nada em andamento em {g.label}.<button className="btn primary" onClick={() => setTab('desejos')}><Bookmark className="i" aria-hidden />Escolher na lista de desejos</button></div>}
      {paused.length > 0 && <><h2 className="sec-h">Pausados <small>{paused.length}</small></h2><div className={`grid g-${u}`}>{paused.map(it => <PosterCard key={it.id} it={it} />)}</div></>}
      {recent.length > 0 && <><h2 className="sec-h">Concluídos recentemente</h2><div className={`grid g-${u}`}>{recent.map(it => <PosterCard key={it.id} it={it} />)}</div></>}
    </>
  );
}

function NowSection({ u }: { u: Universo }) {
  const { items, setU, setTab, openEditor } = useLibrary();
  const L = items.filter(i => uniOf(i) === u);
  const now = L.filter(i => i.status === 'consumindo').sort(byUpd);
  const paused = L.filter(i => i.status === 'pausado').sort(byUpd);
  const meta = `${now.length} em andamento${paused.length ? ` · ${paused.length} pausado${paused.length > 1 ? 's' : ''}` : ''}`;
  return (
    <USection u={u} meta={meta}>
      {now.length
        ? <div className="now-grid">{now.map(it => <NowCard key={it.id} it={it} />)}</div>
        : <p className="u-empty">Nada em andamento. <button className="link" onClick={() => { setU(u); setTab('desejos'); }}>Escolher na lista de desejos</button></p>}
      {paused.length > 0 && (
        <div className="paused"><span>Pausados</span>
          {paused.map(p => <button key={p.id} className="chip" onClick={() => openEditor(p.id)}><Pause className="i" aria-hidden />{p.titulo}<span className="n">{progress(p).l}</span></button>)}
        </div>
      )}
    </USection>
  );
}
