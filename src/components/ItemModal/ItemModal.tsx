import { AnimatePresence, motion } from 'framer-motion';
import { Check, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CATS, DEF, GROUPS, NUM, SPEC, STATUS, blank, clean } from '../../data/catalog';
import { asDate, today } from '../../lib/dates';
import { useLibrary } from '../../store/useLibrary';
import type { Categoria, Draft, Status } from '../../types/media';
import { StarInput } from '../Stars';
import { CAT_ICON } from '../icons';

export function ItemModal() {
  const { editing, closeEditor } = useLibrary();
  useEffect(() => {
    if (!editing) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeEditor();
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [editing, closeEditor]);
  return <AnimatePresence>{editing && <Sheet key={editing.id || 'new'} id={editing.id} />}</AnimatePresence>;
}

const narrow = () => window.matchMedia('(max-width:640px)').matches;

function Sheet({ id }: { id: string | null }) {
  const { items, u, tab, closeEditor, upsert, remove, toast } = useLibrary();
  const isNew = !id;
  const [d, setD] = useState<Draft>(() => {
    const found = id && items.find(i => i.id === id);
    if (found) return JSON.parse(JSON.stringify(found));
    const cat: Categoria = u === 'todos' ? 'filme' : GROUPS[u].def;
    return blank(cat, tab === 'desejos' ? 'wishlist' : 'consumindo');
  });
  const [err, setErr] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const C = CATS[d.categoria];
  const set = (k: string, v: any) => setD(p => ({ ...p, [k]: v }));
  const setField = (k: string, raw: string) => set(k, NUM.has(k) ? (raw === '' ? null : Number(raw)) : raw);
  const switchCat = (cat: Categoria) => setD(p => { const n: Draft = { ...p, categoria: cat }; const f = JSON.parse(JSON.stringify(DEF[cat])); for (const k in f) if (n[k] === undefined) n[k] = f[k]; return n; });

  const save = () => {
    if (!String(d.titulo || '').trim()) { setErr(true); document.getElementById('f-titulo')?.focus(); return; }
    const it: any = clean({ ...d, titulo: d.titulo.trim() });
    if (it.status === 'concluido' && !it.dataConclusao) it.dataConclusao = today();
    if (it.status === 'consumindo' && !it.dataInicio) it.dataInicio = today();
    if (it.status === 'wishlist' && !it.prioridade) it.prioridade = 'Médio';
    it.updatedAt = Date.now();
    upsert(it); closeEditor(); toast(isNew ? 'Adicionado ao acervo' : 'Alterações salvas');
  };
  const del = () => { remove(d.id); closeEditor(); toast(`“${d.titulo}” excluído`); };

  const sheetMotion = narrow()
    ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' }, transition: { type: 'spring', damping: 30, stiffness: 300 } }
    : { initial: { opacity: 0, scale: .92, y: 14 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: .96, y: 8 }, transition: { type: 'spring', damping: 22, stiffness: 320 } };

  return (
    <div className="ov">
      <motion.div className="scrim" onClick={closeEditor} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ animation: 'none' }} />
      <motion.div className="sheet glass" role="dialog" aria-modal="true" aria-labelledby="m-title" style={{ animation: 'none' }} {...(sheetMotion as any)}>
        <div className="grab" />
        <header className="sh-h">
          <h2 id="m-title">{isNew ? 'Novo item' : 'Editar item'}</h2>
          <button className="icon-btn" onClick={closeEditor} aria-label="Fechar"><X className="i" aria-hidden /></button>
        </header>
        <div className="sh-b">
          <form onSubmit={e => { e.preventDefault(); save(); }} noValidate style={{ ['--c' as any]: C.color }}>
            <div className="seg" role="radiogroup" aria-label="Categoria">
              {(Object.keys(CATS) as Categoria[]).map(k => {
                const Icon = CAT_ICON[k];
                return <button key={k} type="button" role="radio" aria-checked={k === d.categoria} className={k === d.categoria ? 'on' : ''} style={{ ['--c' as any]: CATS[k].color }} onClick={() => switchCat(k)}><Icon className="i" aria-hidden /><span>{CATS[k].label}</span></button>;
              })}
            </div>
            <div className="fg">
              <label className="fld full"><span>Título</span>
                <input className="in" id="f-titulo" value={d.titulo} placeholder="Ex.: Duna: Parte Dois" autoComplete="off" onChange={e => { set('titulo', e.target.value); setErr(false); }} />
                {err && <small className="err">Dê um título ao item para salvar.</small>}
              </label>
              <label className="fld"><span>Status</span>
                <select className="in" value={d.status} onChange={e => set('status', e.target.value as Status)}>
                  {(Object.keys(STATUS) as Status[]).map(k => <option key={k} value={k}>{k === 'consumindo' ? `${STATUS[k]} (${C.verb.toLowerCase()})` : STATUS[k]}</option>)}
                </select>
              </label>
              <label className="fld"><span>Favorito</span>
                <span className="sw"><input type="checkbox" checked={!!d.favorito} onChange={e => set('favorito', e.target.checked)} /><i /><em>{d.favorito ? 'Sim' : 'Não'}</em></span>
              </label>
              {d.status === 'wishlist' && (
                <label className="fld full"><span>Prioridade / Hype</span>
                  <select className="in" value={d.prioridade || 'Médio'} onChange={e => set('prioridade', e.target.value)}>
                    {['Alto', 'Médio', 'Baixo'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </label>
              )}
              <div className="fld full"><span>Nota</span><StarInput value={d.nota || 0} onChange={v => set('nota', v)} /></div>
              <label className="fld"><span>Data de início</span><input className="in" type="date" value={d.dataInicio || ''} onChange={e => set('dataInicio', e.target.value)} /></label>
              <label className="fld"><span>Data de conclusão</span><input className="in" type="date" value={d.dataConclusao || ''} onChange={e => set('dataConclusao', e.target.value)} /></label>

              <div className="sub-h">{(() => { const I = CAT_ICON[d.categoria]; return <I className="i" aria-hidden />; })()}Detalhes de {C.label.toLowerCase()}</div>
              {SPEC[d.categoria].map(([k, label, type]) => (
                <label key={k} className={`fld ${type === 'text' ? 'full' : ''}`}><span>{label}</span>
                  {Array.isArray(type)
                    ? <select className="in" value={d[k] ?? type[0]} onChange={e => setField(k, e.target.value)}>{type.map(o => <option key={o}>{o}</option>)}</select>
                    : <input className="in" type={type} inputMode={type === 'number' ? 'numeric' : undefined} min={type === 'number' ? 0 : undefined} value={d[k] ?? ''} onChange={e => setField(k, e.target.value)} />}
                </label>
              ))}
              {d.categoria === 'filme' && (
                <div className="fld full"><span>Histórico de rewatch</span>
                  <div className="rw">
                    {(d.historicoRewatch || []).map((r: string, i: number) => (
                      <button key={r + i} type="button" className="chip" aria-label={`Remover ${r}`} onClick={() => set('historicoRewatch', d.historicoRewatch.filter((_: string, j: number) => j !== i))}>
                        <RotateCcw className="i" aria-hidden />{asDate(r).toLocaleDateString('pt-BR')}<X className="i" aria-hidden />
                      </button>
                    ))}
                    <button type="button" className="btn" onClick={() => set('historicoRewatch', [...(d.historicoRewatch || []), today()])}><Plus className="i" aria-hidden />Revi hoje</button>
                  </div>
                </div>
              )}
              <label className="fld full"><span>URL da capa</span><input className="in" type="url" value={d.capaUrl || ''} placeholder="https://…/capa.jpg" autoComplete="off" onChange={e => set('capaUrl', e.target.value)} /></label>
              <label className="fld full"><span>Review</span><textarea className="in" value={d.review || ''} placeholder="O que ficou com você?" onChange={e => set('review', e.target.value)} /></label>
            </div>
          </form>
        </div>
        <footer className="sh-f">
          {!isNew && (confirmDel
            ? <button className="btn danger" onClick={del}><Trash2 className="i" aria-hidden />Confirmar exclusão</button>
            : <button className="btn ghost" onClick={() => setConfirmDel(true)}><Trash2 className="i" aria-hidden />Excluir</button>)}
          <span className="sp" />
          <button className="btn" onClick={closeEditor}>Cancelar</button>
          <button className="btn primary lg" onClick={save}><Check className="i" aria-hidden />{isNew ? 'Adicionar' : 'Salvar'}</button>
        </footer>
      </motion.div>
    </div>
  );
}
