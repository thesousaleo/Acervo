import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { meta, type MetaHit } from '../../services/meta';
import type { Categoria } from '../../types/media';

const PH: Record<Categoria, string> = { filme: 'Nome do filme', serie: 'Nome da série', anime: 'Nome do anime', livro: 'Título do livro ou autor', hq: 'Nome do mangá ou HQ', jogo: 'Nome do jogo' };

/** Busca online: digita, escolhe um resultado e o item já vem preenchido. */
export function MetaSearch({ cat, initial, onPick, autoFocus }: { cat: Categoria; initial: string; onPick: (dados: Record<string, any>) => void; autoFocus?: boolean }) {
  const [q, setQ] = useState(initial);
  const [hits, setHits] = useState<MetaHit[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const seq = useRef(0);

  const go = async (text = q) => {
    const t = text.trim(); if (t.length < 2) { setHits(null); return; }
    const my = ++seq.current;
    setBusy(true); setErr('');
    try { const r = await meta.search(cat, t); if (my === seq.current) setHits(r); }
    catch (e: any) { if (my === seq.current) setErr(/não configurad/.test(e.message) ? 'A busca deste tipo ainda não está ativada. Preencha manualmente.' : 'Busca indisponível agora. Tente de novo ou preencha manualmente.'); }
    finally { if (my === seq.current) setBusy(false); }
  };
  // busca enquanto digita (com pequena espera)
  useEffect(() => { const id = setTimeout(() => go(q), 450); return () => clearTimeout(id); }, [q, cat]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = async (h: MetaHit) => {
    setBusy(true); setErr('');
    try { onPick(await meta.details(cat, h)); }
    catch { setErr('Não consegui buscar os detalhes. Tente outro resultado.'); setBusy(false); }
  };
  return (
    <div className="msearch">
      <label className="msearch-bar">
        <Search className="i" aria-hidden />
        <input value={q} autoFocus={autoFocus} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); go(); } }}
          placeholder={PH[cat]} aria-label="Buscar" autoComplete="off" enterKeyHint="search" />
        {busy && <span className="spin" aria-label="Buscando" />}
      </label>
      {err && <p className="err">{err}</p>}
      {hits && (hits.length ? (
        <ul className="hits">
          {hits.map(h => (
            <li key={h.fonte + h.extId}>
              <button type="button" onClick={() => pick(h)}>
                {h.capa ? <img src={h.capa} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span className="noimg" />}
                <span className="hit-tx"><b>{h.titulo}</b><span>{[h.ano, h.sub].filter(Boolean).join(' · ')}</span></span>
              </button>
            </li>
          ))}
        </ul>
      ) : <p className="quiet">Nada encontrado com esse nome.</p>)}
    </div>
  );
}
