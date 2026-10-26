import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { GROUPS, ORDER } from '../data/catalog';
import { useLibrary } from '../store/useLibrary';
import type { UniversoFiltro } from '../types/media';
import { GROUP_ICON } from './icons';

const useNarrow = () => {
  const q = '(max-width:860px)';
  const [n, setN] = useState(() => window.matchMedia(q).matches);
  useEffect(() => { const m = window.matchMedia(q); const f = () => setN(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f); }, []);
  return n;
};

export function Header() {
  const { u, setU, openEditor } = useLibrary();
  const narrow = useNarrow();
  const opts: [UniversoFiltro, string, string, string][] = [['todos', 'Tudo', 'Tudo', 'var(--fg)'], ...ORDER.map(k => [k, GROUPS[k].label, GROUPS[k].short, GROUPS[k].color] as [UniversoFiltro, string, string, string])];
  const todayLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <header className="top">
      <div className="top-in glass">
        <div className="brand"><span className="mark" />Acervo</div>
        <nav className="uni" aria-label="Tipo de conteúdo">
          {opts.map(([k, l, sh, col]) => {
            const Icon = GROUP_ICON[k];
            return (
              <button key={k} className={u === k ? 'on' : ''} style={{ ['--uc' as any]: col }} aria-pressed={u === k} onClick={() => setU(k)}>
                <Icon className="i" aria-hidden /><span>{narrow ? sh : l}</span>
              </button>
            );
          })}
        </nav>
        <span className="today">{todayLabel}</span>
        <button className="btn primary add" onClick={() => openEditor(null)} aria-label="Adicionar item"><Plus className="i" aria-hidden />Adicionar</button>
      </div>
    </header>
  );
}
