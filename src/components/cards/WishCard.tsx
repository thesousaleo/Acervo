import { Flame, Play } from 'lucide-react';
import { CATS, PRI } from '../../data/catalog';
import { sub } from '../../lib/progress';
import { useLibrary, useQuickActions } from '../../store/useLibrary';
import type { MediaItem } from '../../types/media';
import { Cover } from '../Cover';
import { CAT_ICON } from '../icons';

export function WishCard({ it }: { it: MediaItem }) {
  const { openEditor } = useLibrary();
  const { start } = useQuickActions();
  const c = CATS[it.categoria], pri = it.prioridade || 'Médio', p = PRI[pri], Icon = CAT_ICON[it.categoria];
  return (
    <article className="wi glass" style={{ ['--c' as any]: c.color }}>
      <Cover it={it} size="sm" />
      <div style={{ minWidth: 0 }}>
        <div className="eyebrow"><Icon className="i" aria-hidden />{c.label}</div>
        <button className="ttl" onClick={() => openEditor(it.id)}>{it.titulo}</button>
        <div className="meta">{sub(it)}</div>
        <div className="hype" aria-label={`Prioridade ${pri}`}>
          {[1, 2, 3].map(i => <span key={i} className={i <= p ? 'on' : ''}><Flame className="i" aria-hidden /></span>)}<em>{pri}</em>
        </div>
      </div>
      <button className="btn primary go" onClick={() => start(it.id)}><Play className="i" aria-hidden />Começar agora</button>
    </article>
  );
}
