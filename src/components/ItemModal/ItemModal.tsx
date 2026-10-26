import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock, Check, ExternalLink, Plus, RotateCcw, Search, Share2, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CAT_ORDER, CATS, DEF, GROUPS, NUM, PLATAFORMAS, SPEC, STATUS, TAGS_SUGERIDAS, blank, clean } from '../../data/catalog';
import { asDate, today } from '../../lib/dates';
import { remaining } from '../../lib/progress';
import { shareItem } from '../../services/shareImage';
import { useLibrary } from '../../store/useLibrary';
import type { Categoria, Draft, Status } from '../../types/media';
import { StarInput } from '../Stars';
import { CAT_ICON } from '../icons';
import { ChipsInput } from './Chips';
import { MetaSearch } from './MetaSearch';

export function ItemModal() {
  const { editing, closeEditor } = useLibrary();
  useEffect(() => {
    if (!editing) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeEditor();
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [editing, closeEditor]);
  return <AnimatePresence>{editing && <Sheet key={editing.id || 'new'} id={editing.id} status={editing.status} />}</AnimatePresence>;
}

const narrow = () => window.matchMedia('(max-width:640px)').matches;
const fmt = (iso: string) => asDate(iso).toLocaleDateString('pt-BR');

function Sheet({ id, status }: { id: string | null; status?: Status }) {
  const { items, u, closeEditor, upsert, remove, toast } = useLibrary();
  const isNew = !id;
  const [d, setD] = useState<Draft>(() => {
    const found = id && items.find(i => i.id === id);
    if (found) return clean(JSON.parse(JSON.stringify(found))) as Draft;
    const cat: Categoria = u === 'todos' ? 'filme' : GROUPS[u].def;
    return blank(cat, status || 'consumindo');
  });
  const [err, setErr] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [showSearch, setShowSearch] = useState(isNew);
  const C = CATS[d.categoria];
  const set = (k: string, v: any) => setD(p => ({ ...p, [k]: v }));
  const setField = (k: string, raw: string) => set(k, NUM.has(k) ? (raw === '' ? null : Number(raw)) : raw);
  const switchCat = (cat: Categoria) => setD(p => { const n: Draft = { ...p, categoria: cat }; const f = JSON.parse(JSON.stringify(DEF[cat])); for (const k in f) if (n[k] === undefined) n[k] = f[k]; return n; });
  const allLists = useMemo(() => [...new Set(items.flatMap(i => i.listas || []))].sort(), [items]);
  const allTags = useMemo(() => [...new Set([...TAGS_SUGERIDAS, ...items.flatMap(i => i.tags || [])])], [items]);

  const applyMeta = (m: Record<string, any>) => setD(p => {
    const n: Draft = { ...p };
    for (const [k, v] of Object.entries(m)) { if (k === 'plataformas' || v === undefined || v === null || v === '') continue; n[k] = v; }
    if (d.categoria === 'jogo' && Array.isArray(m.plataformas) && m.plataformas.length) {
      const p1 = m.plataformas.find((x: string) => PLATAFORMAS.includes(x)); if (p1) n.plataforma = p1;
    }
    return n;
  });

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
  const share = async () => { try { const how = await shareItem(clean(d)); toast(how === 'share' ? 'Pronto para compartilhar' : 'Imagem baixada'); } catch { toast('Não foi possível gerar a imagem'); } };

  const sheetMotion = narrow()
    ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' }, transition: { type: 'spring', damping: 30, stiffness: 300 } }
    : { initial: { opacity: 0, scale: .92, y: 14 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: .96, y: 8 }, transition: { type: 'spring', damping: 22, stiffness: 320 } };
  const Icon = CAT_ICON[d.categoria];
  const sessoes = [...(d.sessoes || [])].reverse().slice(0, 12);
  const left = remaining(d);

  return (
    <div className="ov">
      <motion.div className="scrim" onClick={closeEditor} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ animation: 'none' }} />
      <motion.div className="sheet glass" role="dialog" aria-modal="true" aria-labelledby="m-title" style={{ animation: 'none' }} {...(sheetMotion as any)}>
        <div className="grab" />
        <header className="sh-h">
          <h2 id="m-title">{isNew ? 'Novo item' : 'Editar item'}</h2>
          {!showSearch && <button className="btn ghost" onClick={() => setShowSearch(true)} aria-label="Buscar dados online"><Search className="i" aria-hidden /><span className="hide-sm">Buscar dados</span></button>}
          <button className="icon-btn" onClick={closeEditor} aria-label="Fechar"><X className="i" aria-hidden /></button>
        </header>
        <div className="sh-b">
          <form onSubmit={e => { e.preventDefault(); save(); }} noValidate style={{ ['--c' as any]: C.color }}>
            <div className="seg seg6" role="radiogroup" aria-label="Categoria">
              {CAT_ORDER.map(k => {
                const I = CAT_ICON[k];
                return <button key={k} type="button" role="radio" aria-checked={k === d.categoria} className={k === d.categoria ? 'on' : ''} style={{ ['--c' as any]: CATS[k].color }} onClick={() => switchCat(k)}><I className="i" aria-hidden /><span>{CATS[k].label}</span></button>;
              })}
            </div>

            {showSearch && <MetaSearch key={d.categoria} cat={d.categoria} initial={d.titulo} onPick={applyMeta} />}

            {d.capaUrl && <div className="m-cover"><img src={d.capaUrl} alt="" referrerPolicy="no-referrer" /></div>}

            <div className="fg">
              <label className="fld full"><span>Título</span>
                <input className="in" id="f-titulo" value={d.titulo} placeholder="Ex.: Duna: Parte Dois" autoComplete="off" onChange={e => { set('titulo', e.target.value); setErr(false); }} />
                {err && <small className="err">Dê um título ao item para salvar.</small>}
              </label>
              <label className="fld"><span>Status</span>
                <select className="in" value={d.status} onChange={e => set('status', e.target.value as Status)}>
                  {(Object.keys(STATUS) as Status[]).map(k => <option key={k} value={k}>{k === 'consumindo' ? C.verb : STATUS[k]}</option>)}
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

              <div className="sub-h"><Icon className="i" aria-hidden />Detalhes de {C.label.toLowerCase()}</div>
              {SPEC[d.categoria].map(([k, label, type]) => (
                <label key={k} className={`fld ${type === 'text' ? 'full' : ''}`}><span>{label}</span>
                  {Array.isArray(type)
                    ? <select className="in" value={d[k] ?? type[0]} onChange={e => setField(k, e.target.value)}>{type.map(o => <option key={o}>{o}</option>)}</select>
                    : <input className="in" type={type} inputMode={type === 'number' ? 'numeric' : undefined} min={type === 'number' ? 0 : undefined} value={d[k] ?? ''} onChange={e => setField(k, e.target.value)} />}
                </label>
              ))}
              {d.categoria === 'jogo' && (
                <label className="fld"><span>Duração média (h)</span>
                  <input className="in" type="number" min={0} inputMode="numeric" value={d.tempoEstimado?.normal ?? ''} placeholder="ex.: 40"
                    onChange={e => set('tempoEstimado', { ...(d.tempoEstimado || { rapido: null, completo: null }), normal: e.target.value === '' ? null : Number(e.target.value) })} />
                </label>
              )}
              {d.categoria === 'serie' && Array.isArray(d.temporadas) && d.temporadas.length > 0 && (
                <p className="fld full m-note">Episódios por temporada: {d.temporadas.join(' · ')}</p>
              )}
              {d.proximoEp?.data && (
                <p className="fld full m-note"><CalendarClock className="i" aria-hidden />Próximo episódio: {d.proximoEp.temporada ? `T${d.proximoEp.temporada}E${d.proximoEp.episodio}` : `ep. ${d.proximoEp.episodio}`} em {fmt(d.proximoEp.data)}</p>
              )}
              {left && <p className="fld full m-note">{left}</p>}

              {d.onde && d.onde.lista?.length > 0 && (
                <div className="fld full"><span>Onde assistir no Brasil</span>
                  <div className="onde">
                    {d.onde.lista.slice(0, 8).map((p: any) => <span key={p.nome + p.tipo} className="prov" title={`${p.nome} (${p.tipo})`}>{p.logo ? <img src={p.logo} alt="" /> : null}<span>{p.nome}<small>{p.tipo}</small></span></span>)}
                  </div>
                  {d.onde.link && <a className="sh-link" href={d.onde.link} target="_blank" rel="noreferrer">Ver no JustWatch<ExternalLink className="i" aria-hidden /></a>}
                </div>
              )}

              <div className="fld full"><span>Gêneros</span><ChipsInput id="f-generos" value={d.generos || []} onChange={v => set('generos', v)} placeholder="Ex.: Drama, Ficção científica" /></div>
              <div className="fld full"><span>Tags (clima, ritmo…)</span><ChipsInput id="f-tags" value={d.tags || []} onChange={v => set('tags', v)} suggestions={allTags} placeholder="Ex.: leve, intenso" /></div>
              <div className="fld full"><span>Listas</span><ChipsInput id="f-listas" value={d.listas || []} onChange={v => set('listas', v)} suggestions={allLists} placeholder="Ex.: Maratona Nolan" /></div>

              <div className="fld full"><span>{C.repetir.replace(' hoje', '')}: histórico</span>
                <div className="rw">
                  {(d.historicoRewatch || []).map((r: string, i: number) => (
                    <button key={r + i} type="button" className="chip" aria-label={`Remover ${r}`} onClick={() => set('historicoRewatch', d.historicoRewatch.filter((_: string, j: number) => j !== i))}>
                      <RotateCcw className="i" aria-hidden />{fmt(r)}<X className="i" aria-hidden />
                    </button>
                  ))}
                  <button type="button" className="btn" onClick={() => set('historicoRewatch', [...(d.historicoRewatch || []), today()])}><Plus className="i" aria-hidden />{C.repetir}</button>
                </div>
              </div>

              <label className="fld full"><span>Review</span><textarea className="in" value={d.review || ''} placeholder="O que ficou com você?" onChange={e => set('review', e.target.value)} /></label>
              <label className="fld full"><span>URL da capa</span><input className="in" type="url" value={d.capaUrl || ''} placeholder="https://…/capa.jpg" autoComplete="off" onChange={e => set('capaUrl', e.target.value)} /></label>

              {sessoes.length > 0 && (
                <div className="fld full"><span>Sessões recentes</span>
                  <ul className="sess">
                    {sessoes.map(s => <li key={s.ts}><b>{fmt(s.data)}</b> {s.acao}{s.nota && <em>{s.nota}</em>}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </form>
        </div>
        <footer className="sh-f">
          {!isNew && (confirmDel
            ? <button className="btn danger" onClick={del}><Trash2 className="i" aria-hidden />Confirmar</button>
            : <button className="btn ghost" onClick={() => setConfirmDel(true)} aria-label="Excluir"><Trash2 className="i" aria-hidden /><span className="hide-sm">Excluir</span></button>)}
          {!isNew && <button className="btn ghost" onClick={share} aria-label="Compartilhar como imagem"><Share2 className="i" aria-hidden /><span className="hide-sm">Compartilhar</span></button>}
          <span className="sp" />
          <button className="btn btn-cancel" onClick={closeEditor}>Cancelar</button>
          <button className="btn primary lg" onClick={save}><Check className="i" aria-hidden />{isNew ? 'Adicionar' : 'Salvar'}</button>
        </footer>
      </motion.div>
    </div>
  );
}
