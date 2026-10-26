import { ArrowRight, Dices } from 'lucide-react';
import { useState } from 'react';
import { GROUPS, ORDER } from '../data/catalog';
import { yearNow } from '../lib/dates';
import { metasDo } from '../lib/goals';
import { byDone, byUpd, uStats } from '../lib/progress';
import { useLibrary } from '../store/useLibrary';
import { GROUP_ICON } from '../components/icons';
import { Hero } from '../components/items/Hero';
import { ContItem } from '../components/items/ContItem';
import { RowItem } from '../components/items/RowItem';
import { GoalBars } from '../components/Goals';
import { Upcoming, upcomingOf } from '../components/Upcoming';
import { PickSheet } from '../components/PickSheet';

export function Inicio() {
  const { items, setTab, config } = useLibrary();
  const [picking, setPicking] = useState(false);
  const h = new Date().getHours();
  const hello = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const now = items.filter(i => i.status === 'consumindo').sort(byUpd);
  const recent = items.filter(i => i.status === 'concluido').sort(byDone).slice(0, 6);
  const up = upcomingOf(items, 14).slice(0, 5);
  const [first, ...rest] = now;
  const ano = yearNow(), m = metasDo(config, ano);
  const temMetas = ['filmes', 'series', 'livros', 'jogos', 'paginas'].some(k => (m as any)[k]);
  return (
    <>
      <div className="greet-row">
        <p className="greet">{hello}. {now.length ? `${now.length} ${now.length === 1 ? 'coisa' : 'coisas'} em andamento.` : 'Nada em andamento agora.'}</p>
        <button className="btn tint" style={{ ['--c' as any]: 'var(--u)' }} onClick={() => setPicking(true)}><Dices className="i" aria-hidden />O que eu faço agora?</button>
      </div>
      {first && <Hero it={first} />}
      <div className="ledger">
        {ORDER.map(u => {
          const g = GROUPS[u], s = uStats(items, u), Icon = GROUP_ICON[u];
          return (
            <button key={u} className="ld" style={{ ['--uc' as any]: g.color }} onClick={() => setTab(u)}>
              <span className="ld-l"><Icon className="i" aria-hidden />{g.label}</span>
              <b>{s.now}</b><span className="ld-s">{s.nowLabel.toLowerCase()}</span>
              <span className="ld-f">{s.foot}</span>
            </button>
          );
        })}
      </div>
      {up.length > 0 && <><h2 className="sh">Próximos episódios</h2><Upcoming list={up} /></>}
      {rest.length > 0 && <><h2 className="sh">Continuar</h2><div className="strip">{rest.map(it => <ContItem key={it.id} it={it} />)}</div></>}
      {temMetas && <><h2 className="sh">Metas de {ano} <button className="sh-link" onClick={() => setTab('diario')}>Retrospectiva<ArrowRight className="i" aria-hidden /></button></h2><GoalBars ano={ano} /></>}
      {recent.length > 0 && (
        <>
          <h2 className="sh">Terminados recentemente <button className="sh-link" onClick={() => setTab('diario')}>Ver diário<ArrowRight className="i" aria-hidden /></button></h2>
          <ul className="rows">{recent.map(it => <RowItem key={it.id} it={it} mode="feito" />)}</ul>
        </>
      )}
      {picking && <PickSheet onClose={() => setPicking(false)} />}
    </>
  );
}
