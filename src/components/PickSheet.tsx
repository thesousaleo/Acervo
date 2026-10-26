import { Dices, Play, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CATS, GROUPS, ORDER, PRI, uniOf } from '../data/catalog';
import { remaining, statusLabel, sub } from '../lib/progress';
import { useLibrary, useQuickActions } from '../store/useLibrary';
import type { MediaItem, UniversoFiltro } from '../types/media';
import { Cover } from './Cover';

type Tempo = 'pouco' | 'noite' | 'fds';
const TEMPOS: [Tempo, string][] = [['pouco', 'Até 1 hora'], ['noite', 'Uma noite'], ['fds', 'Fim de semana']];

function peso(it: any, t: Tempo): number {
  const longo = it.categoria === 'jogo' || (it.categoria === 'filme' && (+it.duracaoMin || 120) > 100);
  if (t === 'pouco' && it.categoria === 'filme') return 0;
  if (t === 'pouco' && it.categoria === 'jogo' && it.status === 'wishlist') return 0;
  let w = it.status === 'consumindo' ? 4 : it.status === 'pausado' ? 1.5 : PRI[it.prioridade || 'Médio'];
  if (t === 'fds' && longo) w *= 1.8;
  if (t === 'noite' && it.categoria === 'filme') w *= 1.5;
  return w;
}

/** "O que eu faço agora?": sorteia algo da sua lista pelo tempo disponível. */
export function PickSheet({ onClose }: { onClose: () => void }) {
  const { items, openEditor } = useLibrary();
  const { start } = useQuickActions();
  const [area, setArea] = useState<UniversoFiltro>('todos');
  const [tempo, setTempo] = useState<Tempo>('noite');
  const [seed, setSeed] = useState(0);
  const pick = useMemo<MediaItem | null>(() => {
    const cand = items.filter(i => ['consumindo', 'pausado', 'wishlist'].includes(i.status) && (area === 'todos' || uniOf(i) === area)).map(i => [i, peso(i, tempo)] as const).filter(([, w]) => w > 0);
    const tot = cand.reduce((a, [, w]) => a + w, 0); if (!tot) return null;
    let r = Math.random() * tot;
    for (const [i, w] of cand) { r -= w; if (r <= 0) return i; }
    return cand[cand.length - 1][0];
  }, [items, area, tempo, seed]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="ov">
      <div className="scrim" onClick={onClose} />
      <div className="sheet glass pick" role="dialog" aria-modal="true" aria-labelledby="p-title">
        <div className="grab" />
        <header className="sh-h"><h2 id="p-title">O que eu faço agora?</h2><button className="icon-btn" onClick={onClose} aria-label="Fechar"><X className="i" aria-hidden /></button></header>
        <div className="sh-b">
          <div className="tabs" role="tablist">
            {([['todos', 'Tudo'], ...ORDER.map(u => [u, GROUPS[u].label])] as [UniversoFiltro, string][]).map(([k, l]) => <button key={k} role="tab" aria-selected={area === k} className={area === k ? 'on' : ''} onClick={() => setArea(k)}>{l}</button>)}
          </div>
          <div className="tabs" role="tablist" style={{ marginTop: 6 }}>
            {TEMPOS.map(([k, l]) => <button key={k} role="tab" aria-selected={tempo === k} className={tempo === k ? 'on' : ''} onClick={() => setTempo(k)}>{l}</button>)}
          </div>
          {pick ? (
            <div className="pick-res" style={{ ['--c' as any]: CATS[pick.categoria].color }}>
              <Cover it={pick} size="sm" />
              <div>
                <div className="kicker">{CATS[pick.categoria].label} · {statusLabel(pick)}</div>
                <h3>{pick.titulo}</h3>
                <p className="quiet">{sub(pick)}</p>
                {remaining(pick) && <p className="quiet">{remaining(pick)}</p>}
              </div>
            </div>
          ) : <p className="quiet" style={{ marginTop: 20 }}>Nada na sua lista combina com isso. Adicione itens à fila.</p>}
        </div>
        <footer className="sh-f">
          <button className="btn ghost" onClick={() => setSeed(s => s + 1)}><Dices className="i" aria-hidden />Outra sugestão</button>
          <span className="sp" />
          {pick && (pick.status === 'consumindo'
            ? <button className="btn primary" onClick={() => { onClose(); openEditor(pick.id); }}>Abrir</button>
            : <button className="btn primary" onClick={() => { start(pick.id); onClose(); }}><Play className="i" aria-hidden />Começar agora</button>)}
        </footer>
      </div>
    </div>
  );
}
