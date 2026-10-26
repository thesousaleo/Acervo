import { Search } from 'lucide-react';
import { useState } from 'react';
import { meta, type MetaHit } from '../../services/meta';
import type { Categoria } from '../../types/media';

const SRC: Record<Categoria, string> = { filme: 'TMDB', serie: 'TMDB', anime: 'AniList', livro: 'Google Livros', hq: 'AniList', jogo: 'IGDB' };

/** Busca online: escolhe um resultado e preenche capa, dados e onde assistir. */
export function MetaSearch({ cat, initial, onPick }: { cat: Categoria; initial: string; onPick: (dados: Record<string, any>) => void }) {
  const [q, setQ] = useState(initial);
  const [hits, setHits] = useState<MetaHit[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const go = async () => {
    if (!q.trim()) return;
    setBusy(true); setErr(''); setHits(null);
    try { setHits(await meta.search(cat, q)); }
    catch (e: any) { setErr(/não configurad/.test(e.message) ? `A busca de ${SRC[cat]} ainda não está ativada (falta a chave no Supabase). Preencha manualmente por enquanto.` : `Busca indisponível agora: ${e.message}`); }
    finally { setBusy(false); }
  };
  const pick = async (h: MetaHit) => {
    setBusy(true); setErr('');
    try { onPick(await meta.details(cat, h)); setHits(null); }
    catch (e: any) { setErr(`Não consegui buscar os detalhes: ${e.message}`); }
    finally { setBusy(false); }
  };
  return (
    <div className="msearch">
      <div className="msearch-bar">
        <Search className="i" aria-hidden />
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); go(); } }} placeholder={`Buscar no ${SRC[cat]}…`} aria-label="Buscar dados online" autoComplete="off" />
        <button type="button" className="btn primary" onClick={go} disabled={busy}>{busy ? 'Buscando…' : 'Buscar'}</button>
      </div>
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
      ) : <p className="quiet">Nada encontrado. Tente outro nome ou preencha manualmente.</p>)}
    </div>
  );
}
