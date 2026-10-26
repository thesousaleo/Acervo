import { Plus, X } from 'lucide-react';
import { useState } from 'react';

/** Campo de etiquetas: digita e Enter (ou vírgula) para adicionar; toque no x para remover. */
export function ChipsInput({ value, onChange, suggestions = [], placeholder, id }: { value: string[]; onChange: (v: string[]) => void; suggestions?: string[]; placeholder: string; id: string }) {
  const [txt, setTxt] = useState('');
  const add = (t: string) => { const v = t.trim(); if (v && !value.some(x => x.toLowerCase() === v.toLowerCase())) onChange([...value, v]); setTxt(''); };
  const sug = suggestions.filter(s => !value.includes(s) && (!txt || s.toLowerCase().includes(txt.toLowerCase()))).slice(0, 8);
  return (
    <div className="chipsin">
      <div className="chipsin-row">
        {value.map(v => <button type="button" key={v} className="chip on" onClick={() => onChange(value.filter(x => x !== v))} aria-label={`Remover ${v}`}>{v}<X className="i" aria-hidden /></button>)}
        <input id={id} className="chipsin-in" value={txt} placeholder={value.length ? '' : placeholder}
          onChange={e => { const t = e.target.value; if (t.endsWith(',')) add(t.slice(0, -1)); else setTxt(t); }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(txt); } else if (e.key === 'Backspace' && !txt && value.length) onChange(value.slice(0, -1)); }}
          onBlur={() => txt && add(txt)} />
      </div>
      {sug.length > 0 && <div className="chipsin-sug">{sug.map(s => <button type="button" key={s} className="chip" onClick={() => add(s)}><Plus className="i" aria-hidden />{s}</button>)}</div>}
    </div>
  );
}
