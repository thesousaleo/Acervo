import { Plus, Settings } from 'lucide-react';
import { useLibrary } from '../store/useLibrary';

export function Header() {
  const { tab, setTab, openEditor } = useLibrary();
  const todayLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <header className="top">
      <div className="top-in">
        <div className="brand"><span className="mark" />Acervo</div>
        <span className="today">{todayLabel}</span>
        <button id="gear" className={`icon-btn add ${tab === 'backup' ? 'on' : ''}`} onClick={() => setTab('backup')} aria-label="Conta e dados"><Settings className="i" aria-hidden /></button>
        <button className="btn primary" onClick={() => openEditor(null)} aria-label="Adicionar item"><Plus className="i" aria-hidden /><span className="lbl">Adicionar</span></button>
      </div>
    </header>
  );
}
