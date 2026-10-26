import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { GROUPS } from '../data/catalog';
import { useLibrary } from '../store/useLibrary';
import type { Universo } from '../types/media';
import { GROUP_ICON } from './icons';

export function UChip() {
  const { u } = useLibrary();
  if (u === 'todos') return null;
  const g = GROUPS[u], Icon = GROUP_ICON[u];
  return <span className="u-chip" style={{ ['--uc' as any]: g.color }}><Icon className="i" aria-hidden />{g.label}</span>;
}

export function USection({ u, meta, children }: { u: Universo; meta: string; children: ReactNode }) {
  const { setU } = useLibrary();
  const g = GROUPS[u], Icon = GROUP_ICON[u];
  return (
    <section className="u-sec" style={{ ['--uc' as any]: g.color }}>
      <header className="u-head">
        <span className="u-ic"><Icon className="i" aria-hidden /></span>
        <div className="u-ht"><h2>{g.label}</h2><p>{meta}</p></div>
        <button className="btn ghost" onClick={() => setU(u)} aria-label={`Ver só ${g.label}`}>Abrir<ArrowRight className="i" aria-hidden /></button>
      </header>
      {children}
    </section>
  );
}
