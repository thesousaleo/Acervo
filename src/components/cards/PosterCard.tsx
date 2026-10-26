import { Heart } from 'lucide-react';
import { CATS } from '../../data/catalog';
import { statusLabel, sub } from '../../lib/progress';
import { useLibrary } from '../../store/useLibrary';
import type { MediaItem } from '../../types/media';
import { Cover, shapeOf } from '../Cover';
import { Stars } from '../Stars';

export function PosterCard({ it }: { it: MediaItem }) {
  const { openEditor } = useLibrary();
  return (
    <button className="poster" onClick={() => openEditor(it.id)} aria-label={`${it.titulo}, ${statusLabel(it)}`}>
      <span className={`pc ${shapeOf(it)}`}>
        <Cover it={it} size="md" />
        <span className={`pill s-${it.status}`}>{statusLabel(it)}</span>
        {it.favorito && <span className="fav"><Heart className="i fill" aria-hidden /></span>}
      </span>
      <span className="p-t">{it.titulo}</span>
      <span className="p-s">{sub(it) || CATS[it.categoria].label}</span>
      {it.nota > 0 && <Stars n={it.nota} />}
    </button>
  );
}
