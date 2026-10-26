import { ArrowRight } from 'lucide-react';
import { GROUPS, ORDER } from '../data/catalog';
import { byDone, byUpd, uStats } from '../lib/progress';
import { useLibrary } from '../store/useLibrary';
import { GROUP_ICON } from '../components/icons';
import { Hero } from '../components/items/Hero';
import { ContItem } from '../components/items/ContItem';
import { RowItem } from '../components/items/RowItem';

export function Inicio() {
  const { items, setTab } = useLibrary();
  const h = new Date().getHours();
  const hello = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const now = items.filter(i => i.status === 'consumindo').sort(byUpd);
  const recent = items.filter(i => i.status === 'concluido').sort(byDone).slice(0, 6);
  const [first, ...rest] = now;
  return (
    <>
      <p className="greet">{hello}. {now.length ? `${now.length} ${now.length === 1 ? 'coisa' : 'coisas'} em andamento.` : 'Nada em andamento agora.'}</p>
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
      {rest.length > 0 && <><h2 className="sh">Continuar</h2><div className="strip">{rest.map(it => <ContItem key={it.id} it={it} />)}</div></>}
      {recent.length > 0 && (
        <>
          <h2 className="sh">Terminados recentemente <button className="sh-link" onClick={() => setTab('diario')}>Ver diário<ArrowRight className="i" aria-hidden /></button></h2>
          <ul className="rows">{recent.map(it => <RowItem key={it.id} it={it} mode="feito" />)}</ul>
        </>
      )}
    </>
  );
}
