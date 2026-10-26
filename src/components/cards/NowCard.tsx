import { Book, Check, Clock, Plus } from 'lucide-react';
import { useState } from 'react';
import { CATS } from '../../data/catalog';
import { progress, sub } from '../../lib/progress';
import { useLibrary, useQuickActions } from '../../store/useLibrary';
import type { MediaItem } from '../../types/media';
import { Cover } from '../Cover';
import { CAT_ICON } from '../icons';

export function NowCard({ it }: { it: MediaItem }) {
  const { openEditor } = useLibrary();
  const q = useQuickActions();
  const a: any = it;
  const [editing, setEditing] = useState(false);
  const [page, setPage] = useState<string>(String(+a.paginaAtual || 0));
  const c = CATS[it.categoria], p = progress(it), Icon = CAT_ICON[it.categoria];
  const savePage = () => { q.page(it.id, Number(page) || 0); setEditing(false); };
  return (
    <article className="now glass" style={{ ['--c' as any]: c.color }}>
      <Cover it={it} size="sm" />
      <div>
        <div className="eyebrow"><Icon className="i" aria-hidden />{c.verb} · {c.label}</div>
        <button className="ttl" onClick={() => openEditor(it.id)}>{it.titulo}</button>
        <div className="meta">{sub(it)}</div>
        {p.pct != null ? <div className="bar"><i style={{ width: `${p.pct}%` }} /></div> : <div className="sep" />}
        <div className="prog"><span>{p.l}</span><span>{p.r}</span></div>
        <div className="acts">
          {it.categoria === 'serie' && <button className="btn tint" onClick={() => q.ep(it.id)}><Plus className="i" aria-hidden />1 Ep</button>}
          {it.categoria === 'livro' && <button className="btn tint" onClick={() => { setPage(String(+a.paginaAtual || 0)); setEditing(e => !e); }}><Book className="i" aria-hidden />Atualizar página</button>}
          {it.categoria === 'jogo' && <button className="btn tint" onClick={() => q.hour(it.id)}><Clock className="i" aria-hidden />+1h</button>}
          <button className="btn ok" onClick={() => q.done(it.id)}><Check className="i" aria-hidden />Concluir hoje</button>
        </div>
        {editing && (
          <div className="pg-edit">
            <input className="in" type="number" inputMode="numeric" min={0} max={a.totalPaginas || undefined} value={page} autoFocus
              aria-label="Página atual" onChange={e => setPage(e.target.value)} onKeyDown={e => e.key === 'Enter' && savePage()} />
            <button className="btn primary" onClick={savePage}>Salvar</button>
            <button className="btn ghost" onClick={() => setEditing(false)}>Cancelar</button>
          </div>
        )}
      </div>
    </article>
  );
}
