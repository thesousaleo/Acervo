import { ArrowRight, Dices, UserRound } from 'lucide-react';
import { useState } from 'react';
import { yearNow } from '../lib/dates';
import { metasDo } from '../lib/goals';
import { byDone, byUpd } from '../lib/progress';
import { useLibrary } from '../store/useLibrary';
import { Hero } from '../components/items/Hero';
import { ContItem } from '../components/items/ContItem';
import { RowItem } from '../components/items/RowItem';
import { GoalBars } from '../components/Goals';
import { Upcoming, upcomingOf } from '../components/Upcoming';
import { PickSheet } from '../components/PickSheet';

export function Inicio() {
  const { items, setTab, config, session, sync } = useLibrary();
  const [picking, setPicking] = useState(false);
  const h = new Date().getHours();
  const hello = h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const now = items.filter(i => i.status === 'consumindo').sort(byUpd);
  const recent = items.filter(i => i.status === 'concluido').sort(byDone).slice(0, 4);
  const up = upcomingOf(items, 14).slice(0, 3);
  const [first, ...rest] = now;
  const ano = yearNow(), m = metasDo(config, ano);
  const temMetas = ['filmes', 'series', 'livros', 'paginas'].some(k => (m as any)[k]);
  const inicial = session?.user.email?.charAt(0).toUpperCase();
  return (
    <>
      <header className="home-top">
        <h1 className="home-hello">{hello}</h1>
        <button className="round-btn" onClick={() => setPicking(true)} aria-label="O que eu faço agora?" title="O que eu faço agora?"><Dices className="i" aria-hidden /></button>
        <button className={`round-btn avatar ${sync.status === 'error' ? 'warn' : ''}`} onClick={() => setTab('backup')} aria-label="Conta e dados" title="Conta e dados">
          {inicial ? <span>{inicial}</span> : <UserRound className="i" aria-hidden />}
        </button>
      </header>

      {first ? <Hero it={first} /> : <p className="quiet empty-home">Nada em andamento. Toque em <b>+</b> para adicionar algo ou abra uma área no menu.</p>}
      {rest.length > 0 && <><h2 className="sh">Continuar</h2><div className="strip">{rest.map(it => <ContItem key={it.id} it={it} />)}</div></>}
      {up.length > 0 && <><h2 className="sh">Próximos episódios</h2><Upcoming list={up} /></>}
      {temMetas && <><h2 className="sh">Metas de {ano}</h2><GoalBars ano={ano} /></>}
      {recent.length > 0 && (
        <>
          <h2 className="sh">Terminados <button className="sh-link" onClick={() => setTab('diario')}>Diário<ArrowRight className="i" aria-hidden /></button></h2>
          <ul className="rows">{recent.map(it => <RowItem key={it.id} it={it} mode="feito" />)}</ul>
        </>
      )}
      {picking && <PickSheet onClose={() => setPicking(false)} />}
    </>
  );
}
