import { cap, yearNow } from '../lib/dates';
import { useLibrary } from '../store/useLibrary';
import type { MediaItem } from '../types/media';
import { DiaryEntry } from '../components/cards/DiaryEntry';
import { UChip } from '../components/Universe';

type E = { it: MediaItem; date: string; kind: 'done' | 'rewatch' };

export function Diario() {
  const { items, inU } = useLibrary();
  const E: E[] = [];
  items.filter(inU).forEach(it => {
    if (it.status === 'concluido' && it.dataConclusao) E.push({ it, date: it.dataConclusao, kind: 'done' });
    ((it as any).historicoRewatch || []).forEach((d: string) => d && E.push({ it, date: d, kind: 'rewatch' }));
  });
  E.sort((a, b) => b.date.localeCompare(a.date));
  const groups: { k: string; items: E[] }[] = [];
  E.forEach(e => { const k = e.date.slice(0, 7); let g = groups.find(x => x.k === k); if (!g) groups.push(g = { k, items: [] }); g.items.push(e); });
  const y = yearNow(), thisYear = E.filter(e => e.date.startsWith(y)).length;
  return (
    <>
      <UChip />
      <h1 className="h1">Diário</h1>
      <p className="lede">Tudo o que você terminou, mês a mês. {thisYear} {thisYear === 1 ? 'registro' : 'registros'} em {y}.</p>
      {groups.length ? groups.map(g => {
        const [yy, mm] = g.k.split('-').map(Number);
        const mName = cap(new Date(yy, mm - 1, 1).toLocaleDateString('pt-BR', { month: 'long' }));
        return (
          <section key={g.k} className="month">
            <h2>{mName}<small>{yy} · {g.items.length}</small></h2>
            <ol className="tl">{g.items.map(e => <DiaryEntry key={e.it.id + e.date + e.kind} {...e} />)}</ol>
          </section>
        );
      }) : <div className="empty glass">Quando você concluir algo, ele aparece aqui com data, nota e review.</div>}
    </>
  );
}
