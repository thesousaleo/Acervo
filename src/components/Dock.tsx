import { Bookmark, CalendarDays, Cloud, Library, Play } from 'lucide-react';
import { useLibrary, type Tab } from '../store/useLibrary';

const TABS: [Tab, string, typeof Play][] = [['agora', 'Agora', Play], ['biblioteca', 'Biblioteca', Library], ['desejos', 'Desejos', Bookmark], ['diario', 'Diário', CalendarDays], ['backup', 'Backup', Cloud]];

export function Dock() {
  const { tab, setTab } = useLibrary();
  return (
    <nav className="dock glass" aria-label="Seções">
      {TABS.map(([k, l, Icon]) => (
        <button key={k} className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => tab !== k && setTab(k)}>
          <Icon className="i" aria-hidden /><span>{l}</span>
        </button>
      ))}
    </nav>
  );
}
