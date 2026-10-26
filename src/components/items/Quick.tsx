import { Book, BookOpen, Clock, Plus } from 'lucide-react';
import { useState } from 'react';
import { useLibrary, useQuickActions } from '../../store/useLibrary';
import type { MediaItem } from '../../types/media';

/** Ação rápida principal de cada tipo (+1 ep, página/capítulo, +1 h). */
export function QuickBtn({ it, className = 'qbtn' }: { it: MediaItem; className?: string }) {
  const q = useQuickActions();
  const { pageEdit, setPageEdit } = useLibrary();
  switch (it.categoria) {
    case 'serie': case 'anime': return <button className={className} onClick={() => q.ep(it.id)} aria-label="Mais um episódio"><Plus className="i" aria-hidden /><span>1 ep</span></button>;
    case 'livro': return <button className={className} onClick={() => setPageEdit(pageEdit === it.id ? null : it.id)} aria-label="Atualizar página"><Book className="i" aria-hidden /><span>página</span></button>;
    case 'hq': return <button className={className} onClick={() => setPageEdit(pageEdit === it.id ? null : it.id)} aria-label="Atualizar capítulo"><BookOpen className="i" aria-hidden /><span>capítulo</span></button>;
    case 'jogo': return <button className={className} onClick={() => q.hour(it.id)} aria-label="Mais uma hora"><Clock className="i" aria-hidden /><span>+1 h</span></button>;
  }
  return null;
}

export function PageEditor({ it }: { it: MediaItem }) {
  const { pageEdit, setPageEdit } = useLibrary();
  const q = useQuickActions();
  const a: any = it;
  const isL = it.categoria === 'livro';
  const [v, setV] = useState(String(+(isL ? a.paginaAtual : a.capituloAtual) || 0));
  if (pageEdit !== it.id) return null;
  const save = () => { q.page(it.id, Number(v) || 0); setPageEdit(null); };
  return (
    <div className="pg-edit">
      <input className="in" type="number" inputMode="numeric" min={0} max={(isL ? a.totalPaginas : a.totalCapitulos) || undefined} value={v} autoFocus aria-label={isL ? 'Página atual' : 'Capítulo atual'}
        onChange={e => setV(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} />
      <button className="btn primary" onClick={save}>Ok</button>
    </div>
  );
}
