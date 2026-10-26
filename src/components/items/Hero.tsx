import { Check } from 'lucide-react';
import { CATS } from '../../data/catalog';
import { hue, progress, remaining } from '../../lib/progress';
import { useLibrary, useQuickActions } from '../../store/useLibrary';
import type { MediaItem } from '../../types/media';
import { Cover } from '../Cover';
import { CAT_ICON } from '../icons';
import { PageEditor, QuickBtn } from './Quick';

/** Destaque do Início: o item mexido por último. */
export function Hero({ it }: { it: MediaItem }) {
  const { openEditor } = useLibrary();
  const { done } = useQuickActions();
  const c = CATS[it.categoria], p = progress(it), Icon = CAT_ICON[it.categoria];
  return (
    <section className="hero" style={{ ['--c' as any]: c.color, ['--glow' as any]: `hsl(${hue(it.titulo)} 80% 55%)` }}>
      <button className="hero-cv" onClick={() => openEditor(it.id)} aria-label={`Editar ${it.titulo}`}><Cover it={it} size="sm" /></button>
      <div className="hero-tx">
        <div className="kicker"><Icon className="i" aria-hidden />{c.verb} agora</div>
        <h2 className="hero-t"><button onClick={() => openEditor(it.id)}>{it.titulo}</button></h2>
        {p.pct != null && <div className="line"><i style={{ width: `${p.pct}%` }} /></div>}
        <p className="hero-p">{[p.l, remaining(it)].filter(Boolean).join(' · ')}</p>
        <div className="hero-a">
          <QuickBtn it={it} className="btn tint" />
          <button className="btn ok" onClick={() => done(it.id)}><Check className="i" aria-hidden />Concluir hoje</button>
        </div>
        <PageEditor it={it} />
      </div>
    </section>
  );
}
