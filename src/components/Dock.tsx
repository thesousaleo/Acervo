import { CalendarDays, House, Plus } from 'lucide-react';
import { GROUPS } from '../data/catalog';
import { useLibrary, type Tab } from '../store/useLibrary';
import { GROUP_ICON } from './icons';

// [aba, rótulo, rótulo curto (celular), ícone, cor]
const TABS: [Tab, string, string, any, string][] = [
  ['inicio', 'Início', 'Início', House, 'var(--fg)'],
  ['tela', GROUPS.tela.label, 'Filmes', GROUP_ICON.tela, GROUPS.tela.color],
  ['jogos', 'Jogos', 'Jogos', GROUP_ICON.jogos, GROUPS.jogos.color],
  ['livros', 'Livros', 'Livros', GROUP_ICON.livros, GROUPS.livros.color],
  ['diario', 'Diário', 'Diário', CalendarDays, 'var(--fg)']
];

/** Menu inferior + botão flutuante de adicionar. */
export function Dock() {
  const { tab, setTab, openEditor } = useLibrary();
  return (
    <div className="navbar">
      <nav className="dock glass" aria-label="Seções">
        {TABS.map(([k, l, sh, Icon, col]) => (
          <button key={k} className={tab === k ? 'on' : ''} style={{ ['--uc' as any]: col }} aria-current={tab === k ? 'page' : undefined} aria-label={l} onClick={() => tab !== k && setTab(k)}>
            <Icon className="i" aria-hidden /><span className="lg">{l}</span><span className="sm">{sh}</span>
          </button>
        ))}
      </nav>
      <button className="fab" onClick={() => openEditor(null)} aria-label="Adicionar"><Plus aria-hidden /></button>
    </div>
  );
}
