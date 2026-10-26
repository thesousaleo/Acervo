import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { CATS, GROUPS, ORDER, uniOf } from '../data/catalog';
import { asDate, cap, yearNow } from '../lib/dates';
import { useLibrary } from '../store/useLibrary';
import type { MediaItem, UniversoFiltro } from '../types/media';
import { Cover } from '../components/Cover';
import { Stars } from '../components/Stars';
import { CAT_ICON } from '../components/icons';

type E = { it: MediaItem; date: string; kind: 'done' | 'rewatch' };

export function Diario() {
  const { items, openEditor } = useLibrary();
  const [du, setDu] = useState<UniversoFiltro>('todos');
  const E: E[] = [];
  items.filter(it => du === 'todos' || uniOf(it) === du).forEach(it => {
    if (it.status === 'concluido' && it.dataConclusao) E.push({ it, date: it.dataConclusao, kind: 'done' });
    ((it as any).historicoRewatch || []).forEach((d: string) => d && E.push({ it, date: d, kind: 'rewatch' }));
  });
  E.sort((a, b) => b.date.localeCompare(a.date));
  const groups: { k: string; items: E[] }[] = [];
  E.forEach(e => { const k = e.date.slice(0, 7); let g = groups.find(x => x.k === k); if (!g) groups.push(g = { k, items: [] }); g.items.push(e); });
  const y = yearNow(), thisYear = E.filter(e => e.date.startsWith(y)).length;
  const tabs: [UniversoFiltro, string][] = [['todos', 'Tudo'], ...ORDER.map(u => [u, GROUPS[u].label] as [UniversoFiltro, string])];
  return (
    <>
      <header className="u-top"><h1 className="u-title">Diário</h1><p className="greet">{thisYear} {thisYear === 1 ? 'registro' : 'registros'} em {y}.</p></header>
      <div className="tabs" role="tablist">
        {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={du === k} className={du === k ? 'on' : ''} style={k !== 'todos' ? { ['--uc' as any]: GROUPS[k].color } : undefined} onClick={() => setDu(k)}>{l}</button>)}
      </div>
      {groups.length ? groups.map(g => {
        const [yy, mm] = g.k.split('-').map(Number);
        const mName = cap(new Date(yy, mm - 1, 1).toLocaleDateString('pt-BR', { month: 'long' }));
        return (
          <section key={g.k} className="dm">
            <h2>{mName} <small>{yy}</small></h2>
            <ol className="dl">
              {g.items.map(({ it, date, kind }) => {
                const c = CATS[it.categoria], Icon = CAT_ICON[it.categoria];
                const wd = asDate(date).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
                return (
                  <li key={it.id + date + kind} style={{ ['--c' as any]: c.color }}>
                    <span className="d-day"><b>{date.slice(8)}</b>{wd}</span>
                    <button className="r-cv" onClick={() => openEditor(it.id)} aria-label={`Editar ${it.titulo}`}><Cover it={it} size="xs" /></button>
                    <div className="d-tx">
                      <button className="d-t" onClick={() => openEditor(it.id)}>{it.titulo}</button>
                      <span className="d-m"><Icon className="i" aria-hidden />{c.label}
                        {kind === 'rewatch' && <> · <RotateCcw className="i" aria-hidden />Rewatch</>}
                        {kind === 'done' && it.nota > 0 && <> · <Stars n={it.nota} /></>}
                      </span>
                      {kind === 'done' && it.review && <p className="d-r">{it.review}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      }) : <p className="quiet">Quando você concluir algo, ele aparece aqui com data, nota e review.</p>}
    </>
  );
}
