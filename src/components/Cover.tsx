import { useState } from 'react';
import type { MediaItem } from '../types/media';
import { PLAT } from '../data/catalog';
import { hue } from '../lib/progress';
import { CAT_ICON } from './icons';

export const shapeOf = (it: MediaItem) => (it.categoria === 'livro' || it.categoria === 'hq') ? 'book' : it.categoria === 'jogo' ? 'game' : 'screen';

/** Capa gerada (gradiente + inicial) com formato por universo; usa capaUrl quando existir. */
export function Cover({ it, size = 'md' }: { it: MediaItem; size?: 'xs' | 'sm' | 'md' }) {
  const [broken, setBroken] = useState(false);
  const h = hue(it.titulo || '?'), shape = shapeOf(it);
  const g = shape === 'book'
    ? `linear-gradient(160deg,hsl(${h} 42% 40%) 0%,hsl(${(h + 24) % 360} 38% 24%) 60%,hsl(${(h + 40) % 360} 34% 13%) 100%)`
    : shape === 'game'
    ? `linear-gradient(140deg,hsl(${h} 88% 56%) 0%,hsl(${(h + 60) % 360} 75% 34%) 55%,hsl(${(h + 120) % 360} 70% 12%) 100%)`
    : `linear-gradient(150deg,hsl(${h} 72% 52%) 0%,hsl(${(h + 48) % 360} 62% 30%) 55%,hsl(${(h + 96) % 360} 58% 12%) 100%)`;
  const Icon = CAT_ICON[it.categoria];
  const a: any = it;
  return (
    <span className={`cv ${size} ${shape}`} style={{ ['--g' as any]: g }}>
      <span className="gl">{(it.titulo || '?').trim().charAt(0).toUpperCase()}</span>
      {shape === 'game' && <span className="plat" style={{ ['--p' as any]: PLAT[a.plataforma] || PLAT.Outro }}>{a.plataforma}</span>}
      <span className="ci"><Icon className="i" aria-hidden /></span>
      {size === 'md' && <span className="ct">{it.titulo}</span>}
      {shape === 'book' && size === 'md' && a.autor && <span className="ca">{a.autor}</span>}
      {it.capaUrl && !broken && <img src={it.capaUrl} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} />}
    </span>
  );
}
