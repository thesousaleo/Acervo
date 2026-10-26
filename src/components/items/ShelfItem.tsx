import { Heart } from 'lucide-react';
import { CATS } from '../../data/catalog';
import { statusLabel } from '../../lib/progress';
import { useLibrary } from '../../store/useLibrary';
import type { MediaItem } from '../../types/media';
import { Cover } from '../Cover';

export function ShelfItem({ it }: { it: MediaItem }) {
  const { openEditor } = useLibrary();
  return (
    <button className="sh-i" onClick={() => openEditor(it.id)} aria-label={`${it.titulo}, ${statusLabel(it)}`} style={{ ['--c' as any]: CATS[it.categoria].color }}>
      <span className="sh-cv"><Cover it={it} size="md" />{it.favorito && <span className="fav"><Heart className="i fill" aria-hidden /></span>}</span>
      <span className="sh-t">{it.titulo}</span>
      <span className="sh-m">{it.status === 'concluido'
        ? (it.nota > 0 ? <span className="g">★ {String(it.nota).replace('.', ',')}</span> : <><i className="dot s-concluido" />Concluído</>)
        : <><i className={`dot s-${it.status}`} />{statusLabel(it)}</>}</span>
    </button>
  );
}
