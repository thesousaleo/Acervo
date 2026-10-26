import { useEffect, useState } from 'react';
import { useLibrary } from '../store/useLibrary';

/** Anotação rápida na última sessão ("onde parei", impressões…). */
export function NoteSheet() {
  const { noteFor, setNoteFor, items, update, toast } = useLibrary();
  const [txt, setTxt] = useState('');
  const it: any = noteFor ? items.find(i => i.id === noteFor) : null;
  useEffect(() => { setTxt(''); }, [noteFor]);
  if (!it) return null;
  const last = (it.sessoes || []).slice(-1)[0];
  const save = () => {
    const t = txt.trim(); if (!t) { setNoteFor(null); return; }
    update(it.id, (x: any) => { const s = x.sessoes || []; if (s.length) s[s.length - 1].nota = t; else x.sessoes = [{ data: new Date().toISOString().slice(0, 10), ts: Date.now(), acao: 'nota', nota: t }]; });
    setNoteFor(null); toast('Anotação salva');
  };
  return (
    <div className="ov">
      <div className="scrim" onClick={() => setNoteFor(null)} />
      <div className="sheet glass note-sheet" role="dialog" aria-modal="true" aria-labelledby="n-title">
        <div className="grab" />
        <header className="sh-h"><h2 id="n-title">Anotar · {it.titulo}</h2></header>
        <div className="sh-b">
          {last && <p className="quiet" style={{ marginBottom: 10 }}>Sessão: {last.acao}</p>}
          <textarea className="in" autoFocus value={txt} onChange={e => setTxt(e.target.value)} placeholder="Onde parou, o que achou, lembretes…" />
        </div>
        <footer className="sh-f"><span className="sp" /><button className="btn" onClick={() => setNoteFor(null)}>Cancelar</button><button className="btn primary" onClick={save}>Salvar</button></footer>
      </div>
    </div>
  );
}
