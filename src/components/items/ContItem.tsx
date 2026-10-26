import { Check } from 'lucide-react';
import { CATS } from '../../data/catalog';
import { progress } from '../../lib/progress';
import { useLibrary, useQuickActions } from '../../store/useLibrary';
import type { MediaItem } from '../../types/media';
import { Cover } from '../Cover';
import { PageEditor, QuickBtn } from './Quick';

/** Capa com progresso, sem caixa (fileira "Continuar" / "Em andamento"). */
export function ContItem({ it }: { it: MediaItem }) {
  const { openEditor } = useLibrary();
  const { done } = useQuickActions();
  const p = progress(it);
  return (
    <article className="cont" style={{ ['--c' as any]: CATS[it.categoria].color }}>
      <div className="cont-cv">
        <button className="cv-btn" onClick={() => openEditor(it.id)} aria-label={`Editar ${it.titulo}`}><Cover it={it} size="sm" /></button>
        <div className="cont-q">
          <QuickBtn it={it} />
          <button className="qbtn ok" onClick={() => done(it.id)} aria-label="Concluir hoje"><Check className="i" aria-hidden /></button>
        </div>
      </div>
      {p.pct != null ? <div className="line"><i style={{ width: `${p.pct}%` }} /></div> : <div className="line off" />}
      <button className="cont-t" onClick={() => openEditor(it.id)}>{it.titulo}</button>
      <span className="cont-m">{p.l}</span>
      <PageEditor it={it} />
    </article>
  );
}
