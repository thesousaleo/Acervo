import { CalendarDays, House } from 'lucide-react';
import { GROUPS, ORDER } from '../data/catalog';
import { useLibrary, type Tab } from '../store/useLibrary';
import { GROUP_ICON } from './icons';

const TABS: [Tab, string, any, string][] = [
  ['inicio', 'Início', House, 'var(--fg)'],
  ...ORDER.map(u => [u, GROUPS[u].short, GROUP_ICON[u], GROUPS[u].color] as [Tab, string, any, string]),
  ['diario', 'Diário', CalendarDays, 'var(--fg)']
];

export function Dock() {
  const { tab, setTab } = useLibrary();
  return (
    <nav className="dock glass" aria-label="Seções">
      {TABS.map(([k, l, Icon, col]) => (
        <button key={k} className={tab === k ? 'on' : ''} style={{ ['--uc' as any]: col }} aria-current={tab === k ? 'page' : undefined} onClick={() => tab !== k && setTab(k)}>
          <Icon className="i" aria-hidden /><span>{l}</span>
        </button>
      ))}
    </nav>
  );
}
