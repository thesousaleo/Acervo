import { Flame, Play } from 'lucide-react';
import { CATS, PRI } from '../../data/catalog';
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
  const c = CATS[it.categoria], p = PRI[it.prioridade || 'Médio'];
  return (
    <li className="row-i" style={{ ['--c' as any]: c.color }}>
      {mode === 'feito' && <span className="r-date">{short(it.dataConclusao)}</span>}
      <button className="r-cv" onClick={() => openEditor(it.id)} aria-label={`Editar ${it.titulo}`}><Cover it={it} size="xs" /></button>
      <button className="r-tx" onClick={() => openEditor(it.id)}><b>{it.titulo}</b><span>{sub(it) || c.label}</span></button>
      <span className="r-end">
        {mode === 'fila'
          ? <>
              <span className="hype" aria-label={`Prioridade ${it.prioridade || 'Médio'}`}>{[1, 2, 3].map(i => <span key={i} className={i <= p ? 'on' : ''}><Flame className="i" aria-hidden /></span>)}</span>
              <button className="pill-btn" onClick={() => start(it.id)}><Play className="i" aria-hidden />Começar</button>
            </>
          : it.nota > 0 && <Stars n={it.nota} />}
      </span>
    </li>
  );
}
