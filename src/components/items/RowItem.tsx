import { Play } from 'lucide-react';
import { CATS } from '../../data/catalog';
import { asDate } from '../../lib/dates';
import { sub } from '../../lib/progress';
import { useLibrary, useQuickActions } from '../../store/useLibrary';
import type { MediaItem } from '../../types/media';
import { Cover } from '../Cover';
import { Stars } from '../Stars';

const short = (iso: string) => iso ? asDate(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '') : '';

/** Linha de lista: "fila" (com hype e Começar) ou "feito" (com data e nota). */
export function RowItem({ it, mode }: { it: MediaItem; mode: 'fila' | 'feito' }) {
  const { openEditor } = useLibrary();
  const { start } = useQuickActions();
  const c = CATS[it.categoria];
  const hot = mode === 'fila' && it.prioridade === 'Alto';
  return (
    <li className="row-i" style={{ ['--c' as any]: c.color }}>
      {mode === 'feito' && <span className="r-date">{short(it.dataConclusao)}</span>}
      <button className="r-cv" onClick={() => openEditor(it.id)} aria-label={`Editar ${it.titulo}`}><Cover it={it} size="xs" /></button>
      <button className="r-tx" onClick={() => openEditor(it.id)}><b>{it.titulo}{hot && <i className="hot-dot" aria-label="muita vontade" />}</b><span>{sub(it) || c.label}</span></button>
      <span className="r-end">
        {mode === 'fila'
          ? <button className="start-btn" onClick={() => start(it.id)} aria-label={`Começar ${it.titulo}`} title="Começar agora"><Play className="i" aria-hidden /></button>
          : it.nota > 0 && <Stars n={it.nota} />}
      </span>
    </li>
  );
}
