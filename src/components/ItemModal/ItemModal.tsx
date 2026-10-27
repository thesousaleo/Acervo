import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, CalendarClock, Check, ChevronDown, ExternalLink, Heart, PenLine, Plus, RotateCcw, Search, Share2, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CAT_ORDER, CATS, DEF, GROUPS, NUM, SPEC, STATUS, TAGS_SUGERIDAS, blank, clean } from '../../data/catalog';
import { asDate, today } from '../../lib/dates';
import { remaining } from '../../lib/progress';
import { shareItem } from '../../services/shareImage';
import { useLibrary } from '../../store/useLibrary';
import type { Categoria, Draft, Status } from '../../types/media';
import { Cover } from '../Cover';
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

/** Campos de progresso de cada tipo (mostrados junto do status, não nos detalhes). */
const PROGRESS: Record<Categoria, [string, string][]> = {
  filme: [],
  serie: [['temporadaAtual', 'Temporada'], ['episodioAtual', 'Último episódio visto']],
  anime: [['episodioAtual', 'Último episódio visto']],
  livro: [['paginaAtual', 'Página atual']],
  hq: [['capituloAtual', 'Capítulo atual']]
};
const STATUS_ORDER: Status[] = ['wishlist', 'consumindo', 'concluido', 'pausado', 'abandonado'];

function Section({ title, hint, children, open }: { title: string; hint?: string; children: ReactNode; open?: boolean }) {
  return (
    <details className="acc" open={open}>
      <summary><span>{title}</span>{hint && <em>{hint}</em>}<ChevronDown className="i" aria-hidden /></summary>
      <div className="acc-b">{children}</div>
    </details>
  );
}

function Sheet({ id, status }: { id: string | null; status?: Status }) {
  const { items, u, closeEditor, upsert, remove, toast } = useLibrary();
  const isNew = !id;
  const [d, setD] = useState<Draft>(() => {
    const found = id && items.find(i => i.id === id);
    if (found) return clean(JSON.parse(JSON.stringify(found))) as Draft;
    const cat: Categoria = u === 'todos' ? 'filme' : GROUPS[u].def;
    return blank(cat, status || 'wishlist');
  });
  // novo item começa pela busca; editar começa no formulário
  const [step, setStep] = useState<'busca' | 'form'>(isNew ? 'busca' : 'form');
  const [err, setErr] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const C = CATS[d.categoria];
  const set = (k: string, v: any) => setD(p => ({ ...p, [k]: v }));
  const setField = (k: string, raw: string) => set(k, NUM.has(k) ? (raw === '' ? null : Number(raw)) : raw);
  const switchCat = (cat: Categoria) => setD(p => { const n: Draft = { ...p, categoria: cat }; const f = JSON.parse(JSON.stringify(DEF[cat])); for (const k in f) if (n[k] === undefined) n[k] = f[k]; return n; });
  const allLists = useMemo(() => [...new Set(items.flatMap(i => i.listas || []))].sort(), [items]);
  const allTags = useMemo(() => [...new Set([...TAGS_SUGERIDAS, ...items.flatMap(i => i.tags || [])])], [items]);

  const applyMeta = (m: Record<string, any>) => {
    setD(p => {
      const n: Draft = { ...p };
      for (const [k, v] of Object.entries(m)) { if (v === undefined || v === null || v === '') continue; n[k] = v; }
      return n;
    });
    setStep('form');
  };
  const setStatus = (s: Status) => setD(p => ({
    ...p, status: s,
    dataInicio: (s === 'consumindo' || s === 'concluido') && !p.dataInicio ? today() : p.dataInicio,
    dataConclusao: s === 'concluido' && !p.dataConclusao ? today() : p.dataConclusao
  }));

  const save = () => {
    if (!String(d.titulo || '').trim()) { setErr(true); setStep('form'); setTimeout(() => document.getElementById('f-titulo')?.focus(), 50); return; }
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
  const sessoes = [...(d.sessoes || [])].reverse().slice(0, 12);
  const left = remaining(d);
  const progressFields = PROGRESS[d.categoria];
  const detailFields = SPEC[d.categoria].filter(([k]) => !progressFields.some(([p]) => p === k));
  const subtitle = [C.label, d.ano || d.autor || d.diretor || d.estudio].filter(Boolean).join(' · ');
  const tagCount = (d.generos?.length || 0) + (d.tags?.length || 0) + (d.listas?.length || 0);

  return (
    <div className="ov">
      <motion.div className="scrim" onClick={closeEditor} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ animation: 'none' }} />
      <motion.div className="sheet glass item-sheet" role="dialog" aria-modal="true" aria-labelledby="m-title" style={{ animation: 'none', ['--c' as any]: C.color }} {...(sheetMotion as any)}>
        <div className="grab" />
        <header className="sh-h">
          {step === 'form' && isNew && <button className="icon-btn" onClick={() => setStep('busca')} aria-label="Voltar para a busca"><ArrowLeft className="i" aria-hidden /></button>}
          <h2 id="m-title">{step === 'busca' ? 'O que você quer adicionar?' : isNew ? 'Novo item' : 'Editar'}</h2>
          <button className="icon-btn" onClick={closeEditor} aria-label="Fechar"><X className="i" aria-hidden /></button>
        </header>

        <div className="sh-b">
          {step === 'busca' ? (
            <div className="step-busca">
              <div className="types" role="radiogroup" aria-label="Tipo">
                {CAT_ORDER.map(k => {
                  const I = CAT_ICON[k];
                  return <button key={k} type="button" role="radio" aria-checked={k === d.categoria} className={k === d.categoria ? 'on' : ''} style={{ ['--c' as any]: CATS[k].color }} onClick={() => switchCat(k)}><I className="i" aria-hidden />{CATS[k].label}</button>;
                })}
              </div>
              <MetaSearch key={d.categoria} cat={d.categoria} initial={d.titulo} onPick={applyMeta} autoFocus={!narrow()} />
              <button type="button" className="manual" onClick={() => setStep('form')}><PenLine className="i" aria-hidden />Não achei, preencher manualmente</button>
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); save(); }} noValidate className="step-form">
              {/* cabeçalho do item */}
              <div className="ihead">
                <div className="ihead-cv">{d.titulo ? <Cover it={clean(d)} size="sm" /> : <span className="cv-empty">{(() => { const I = CAT_ICON[d.categoria]; return <I className="i" aria-hidden />; })()}</span>}</div>
                <div className="ihead-tx">
                  <input className="title-in" id="f-titulo" value={d.titulo} placeholder="Título" autoComplete="off" aria-label="Título"
                    onChange={e => { set('titulo', e.target.value); setErr(false); }} />
                  {err && <small className="err">Dê um título para salvar.</small>}
                  <span className="ihead-sub">{subtitle}</span>
                  {d.onde?.lista?.length > 0 && (
                    <span className="ihead-onde">
                      {d.onde.lista.filter((p: any) => p.tipo === 'assinatura' || p.tipo === 'grátis').slice(0, 4).map((p: any) => p.logo ? <img key={p.nome} src={p.logo} alt={p.nome} title={p.nome} /> : <span key={p.nome}>{p.nome}</span>)}
                      {d.onde.link && <a href={d.onde.link} target="_blank" rel="noreferrer" aria-label="Onde assistir (JustWatch)"><ExternalLink className="i" aria-hidden /></a>}
                    </span>
                  )}
                </div>
                <button type="button" className={`fav-btn ${d.favorito ? 'on' : ''}`} aria-pressed={!!d.favorito} aria-label="Favorito" onClick={() => set('favorito', !d.favorito)}>
                  <Heart className={d.favorito ? 'i fill' : 'i'} aria-hidden />
                </button>
              </div>

              {/* status */}
              <div className="blk">
                <span className="blk-l">Status</span>
                <div className="pills" role="radiogroup" aria-label="Status">
                  {STATUS_ORDER.map(s => <button key={s} type="button" role="radio" aria-checked={d.status === s} className={`pill-s s-${s} ${d.status === s ? 'on' : ''}`} onClick={() => setStatus(s)}><i className="dot" />{s === 'consumindo' ? C.verb : STATUS[s]}</button>)}
                </div>
              </div>

              {/* bloco que muda com o status */}
              {d.status === 'wishlist' && (
                <div className="blk">
                  <span className="blk-l">Vontade de ver ou ler</span>
                  <div className="pills" role="radiogroup" aria-label="Prioridade">
                    {(['Alto', 'Médio', 'Baixo'] as const).map(p => <button key={p} type="button" role="radio" aria-checked={(d.prioridade || 'Médio') === p} className={`pill-s ${(d.prioridade || 'Médio') === p ? 'on' : ''}`} onClick={() => set('prioridade', p)}>{p === 'Alto' ? 'Muita' : p === 'Médio' ? 'Média' : 'Pouca'}</button>)}
                  </div>
                </div>
              )}
              {(d.status === 'consumindo' || d.status === 'pausado') && progressFields.length > 0 && (
                <div className="blk">
                  <span className="blk-l">Progresso</span>
                  <div className="row-f">
                    {progressFields.map(([k, label]) => (
                      <label key={k} className="fld"><span>{label}</span>
                        <input className="in" type="number" min={0} inputMode="numeric" value={d[k] ?? ''} onChange={e => setField(k, e.target.value)} />
                      </label>
                    ))}
                  </div>
                  {left && <p className="m-note">{left}</p>}
                </div>
              )}
              {d.status === 'concluido' && (
                <div className="blk">
                  <span className="blk-l">Sua nota</span>
                  <StarInput value={d.nota || 0} onChange={v => set('nota', v)} />
                  <textarea className="in review" value={d.review || ''} placeholder="O que achou? (opcional)" aria-label="Review" onChange={e => set('review', e.target.value)} />
                  <label className="fld inline"><span>Terminei em</span><input className="in" type="date" value={d.dataConclusao || ''} onChange={e => set('dataConclusao', e.target.value)} /></label>
                </div>
              )}
              {d.proximoEp?.data && (
                <p className="m-note next"><CalendarClock className="i" aria-hidden />Próximo episódio: {d.proximoEp.temporada ? `T${d.proximoEp.temporada}E${d.proximoEp.episodio}` : `ep. ${d.proximoEp.episodio}`} em {fmt(d.proximoEp.data)}</p>
              )}

              {/* o resto fica recolhido */}
              <div className="accs">
                <Section title={`Detalhes do ${C.label.toLowerCase()}`} hint={subtitle.split(' · ')[1]}>
                  <div className="fg">
                    <label className="fld"><span>Tipo</span>
                      <select className="in" value={d.categoria} onChange={e => switchCat(e.target.value as Categoria)}>{CAT_ORDER.map(k => <option key={k} value={k}>{CATS[k].label}</option>)}</select>
                    </label>
                    {detailFields.map(([k, label, type]) => (
                      <label key={k} className={`fld ${type === 'text' ? 'full' : ''}`}><span>{label}</span>
                        {Array.isArray(type)
                          ? <select className="in" value={d[k] ?? type[0]} onChange={e => setField(k, e.target.value)}>{type.map(o => <option key={o}>{o}</option>)}</select>
                          : <input className="in" type={type} inputMode={type === 'number' ? 'numeric' : undefined} min={type === 'number' ? 0 : undefined} value={d[k] ?? ''} onChange={e => setField(k, e.target.value)} />}
                      </label>
                    ))}
                    {(d.status !== 'consumindo' && d.status !== 'pausado') && progressFields.map(([k, label]) => (
                      <label key={k} className="fld"><span>{label}</span><input className="in" type="number" min={0} inputMode="numeric" value={d[k] ?? ''} onChange={e => setField(k, e.target.value)} /></label>
                    ))}
                    <label className="fld"><span>Comecei em</span><input className="in" type="date" value={d.dataInicio || ''} onChange={e => set('dataInicio', e.target.value)} /></label>
                    {d.status !== 'concluido' && <label className="fld"><span>Terminei em</span><input className="in" type="date" value={d.dataConclusao || ''} onChange={e => set('dataConclusao', e.target.value)} /></label>}
                    {d.categoria === 'serie' && Array.isArray(d.temporadas) && d.temporadas.length > 0 && <p className="fld full m-note">Episódios por temporada: {d.temporadas.join(' · ')}</p>}
                    <label className="fld full"><span>Imagem da capa (link)</span><input className="in" type="url" value={d.capaUrl || ''} placeholder="https://…" autoComplete="off" onChange={e => set('capaUrl', e.target.value)} /></label>
                  </div>
                </Section>

                {d.status !== 'concluido' && (
                  <Section title="Nota e review" hint={d.nota ? `★ ${String(d.nota).replace('.', ',')}` : undefined}>
                    <StarInput value={d.nota || 0} onChange={v => set('nota', v)} />
                    <textarea className="in review" value={d.review || ''} placeholder="O que está achando?" aria-label="Review" onChange={e => set('review', e.target.value)} />
                  </Section>
                )}

                <Section title="Gêneros, tags e listas" hint={tagCount ? String(tagCount) : undefined}>
                  <div className="fld"><span>Gêneros</span><ChipsInput id="f-generos" value={d.generos || []} onChange={v => set('generos', v)} placeholder="Ex.: Drama" /></div>
                  <div className="fld"><span>Tags</span><ChipsInput id="f-tags" value={d.tags || []} onChange={v => set('tags', v)} suggestions={allTags} placeholder="Ex.: leve, intenso" /></div>
                  <div className="fld"><span>Listas</span><ChipsInput id="f-listas" value={d.listas || []} onChange={v => set('listas', v)} suggestions={allLists} placeholder="Ex.: Maratona Nolan" /></div>
                </Section>

                {!isNew && (
                  <Section title="Histórico" hint={sessoes.length || d.historicoRewatch?.length ? String(sessoes.length + (d.historicoRewatch?.length || 0)) : undefined}>
                    <div className="rw">
                      {(d.historicoRewatch || []).map((r: string, i: number) => (
                        <button key={r + i} type="button" className="chip" aria-label={`Remover ${r}`} onClick={() => set('historicoRewatch', d.historicoRewatch.filter((_: string, j: number) => j !== i))}>
                          <RotateCcw className="i" aria-hidden />{fmt(r)}<X className="i" aria-hidden />
                        </button>
                      ))}
                      <button type="button" className="btn" onClick={() => set('historicoRewatch', [...(d.historicoRewatch || []), today()])}><Plus className="i" aria-hidden />{C.repetir}</button>
                    </div>
                    {sessoes.length > 0 && <ul className="sess">{sessoes.map(s => <li key={s.ts}><b>{fmt(s.data)}</b> {s.acao}{s.nota && <em>{s.nota}</em>}</li>)}</ul>}
                  </Section>
                )}
              </div>
              {!isNew && <button type="button" className="manual" onClick={() => setStep('busca')}><Search className="i" aria-hidden />Atualizar dados pela busca</button>}
            </form>
          )}
        </div>

        {step === 'form' && (
          <footer className="sh-f">
            {!isNew && (confirmDel
              ? <button className="btn danger" onClick={del}><Trash2 className="i" aria-hidden />Confirmar</button>
              : <button className="icon-btn ghosty" onClick={() => setConfirmDel(true)} aria-label="Excluir"><Trash2 className="i" aria-hidden /></button>)}
            {!isNew && <button className="icon-btn ghosty" onClick={share} aria-label="Compartilhar como imagem"><Share2 className="i" aria-hidden /></button>}
            <span className="sp" />
            <button className="btn primary lg" onClick={save}><Check className="i" aria-hidden />{isNew ? 'Adicionar' : 'Salvar'}</button>
          </footer>
        )}
      </motion.div>
    </div>
  );
}
