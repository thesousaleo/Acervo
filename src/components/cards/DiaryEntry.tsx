import { RotateCcw } from 'lucide-react';
import { CATS } from '../../data/catalog';
import { asDate } from '../../lib/dates';
import { sub } from '../../lib/progress';
import { useLibrary } from '../../store/useLibrary';
import type { MediaItem } from '../../types/media';
import { Cover } from '../Cover';
import { Stars } from '../Stars';
import { CAT_ICON } from '../icons';

export function DiaryEntry({ it, date, kind }: { it: MediaItem; date: string; kind: 'done' | 'rewatch' }) {
  const { openEditor } = useLibrary();
  const c = CATS[it.categoria], Icon = CAT_ICON[it.categoria];
  const wd = asDate(date).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  return (
    <li>
      <div className="day"><b>{date.slice(8)}</b><span>{wd}</span></div>
      <article className="entry glass" style={{ ['--c' as any]: c.color }}>
        <Cover it={it} size="sm" />
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow"><Icon className="i" aria-hidden />{c.label}{kind === 'rewatch' && <span className="tag"><RotateCcw className="i" aria-hidden />Rewatch</span>}</div>
          <button className="ttl" onClick={() => openEditor(it.id)}>{it.titulo}</button>
          <div className="meta">{sub(it)}</div>
          {kind === 'done' && it.nota > 0 && <Stars n={it.nota} />}
          {kind === 'done' && it.review && <blockquote>{it.review}</blockquote>}
        </div>
      </article>
    </li>
  );
}
