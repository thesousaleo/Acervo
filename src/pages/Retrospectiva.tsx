import { Share2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { uniOf } from '../data/catalog';
import { yearNow } from '../lib/dates';
import { goalProgress } from '../lib/goals';
import { shareRetro } from '../services/shareImage';
import { useLibrary } from '../store/useLibrary';
import type { MediaItem } from '../types/media';
import { GoalBars } from '../components/Goals';
import { RowItem } from '../components/items/RowItem';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Resumo do ano: números, meses, notas, gêneros, destaques e metas. */
export function Retrospectiva() {
  const { items, toast } = useLibrary();
  const anos = useMemo(() => {
    const s = new Set<string>([yearNow()]);
    items.forEach(i => { if (i.dataConclusao) s.add(i.dataConclusao.slice(0, 4)); });
    return [...s].sort().reverse();
  }, [items]);
  const [ano, setAno] = useState(anos[0]);

  const R = useMemo(() => {
    const done = items.filter(i => i.status === 'concluido' && (i.dataConclusao || '').startsWith(ano));
    const g = goalProgress(items, ano);
    const filmMin = items.filter(i => i.categoria === 'filme').reduce((a, i: any) => a + ((done.includes(i) ? 1 : 0) + (i.historicoRewatch || []).filter((d: string) => d.startsWith(ano)).length) * (+i.duracaoMin || 0), 0);
    const eps = items.reduce((a, i) => a + (i.sessoes || []).filter(s => s.data.startsWith(ano) && /^T\d+E\d+|^ep\./.test(s.acao)).length, 0);
    const porMes = MESES.map((_, m) => {
      const k = `${ano}-${String(m + 1).padStart(2, '0')}`;
      const L = done.filter(i => i.dataConclusao.startsWith(k));
      return { tela: L.filter(i => uniOf(i) === 'tela').length, livros: L.filter(i => uniOf(i) === 'livros').length };
    });
    const notas = [1, 2, 3, 4, 5].map(n => done.filter(i => i.nota > n - 1 && i.nota <= n).length);
    const gen = new Map<string, number>();
    done.forEach(i => (i.generos || []).forEach(x => gen.set(x, (gen.get(x) || 0) + 1)));
    const generos = [...gen.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const media = done.filter(i => i.nota).reduce((a, i, _, arr) => a + i.nota / arr.length, 0);
    const melhores = done.filter(i => i.nota >= 4.5).sort((a, b) => b.nota - a.nota).slice(0, 8);
    return { done, g, filmMin, eps, porMes, notas, generos, media, melhores };
  }, [items, ano]);

  const maxMes = Math.max(1, ...R.porMes.map(m => m.tela + m.livros));
  const maxNota = Math.max(1, ...R.notas);
  const maxGen = Math.max(1, ...R.generos.map(g => g[1]));
  const figs: [string, string][] = [
    [String(R.done.length), 'concluídos'],
    [String(R.g.filmes), 'sessões de filme'],
    [`${Math.round(R.filmMin / 60)} h`, 'de filme'],
    [String(R.g.livros), 'livros e mangás'],
    [R.g.paginas.toLocaleString('pt-BR'), 'páginas'],
    [R.media ? R.media.toFixed(1).replace('.', ',') : '—', 'nota média']
  ];
  const share = async () => {
    try {
      const how = await shareRetro({ ano, linhas: figs.filter(([v]) => v !== '0' && v !== '0 h' && v !== '—').slice(0, 6), destaques: R.melhores as MediaItem[] });
      toast(how === 'share' ? 'Pronto para compartilhar' : 'Imagem baixada');
    } catch { toast('Não foi possível gerar a imagem'); }
  };

  return (
    <div className="retro">
      <div className="retro-top">
        <select className="plain big" value={ano} onChange={e => setAno(e.target.value)} aria-label="Ano">{anos.map(a => <option key={a}>{a}</option>)}</select>
        <button className="btn tint" style={{ ['--c' as any]: 'var(--u)' }} onClick={share}><Share2 className="i" aria-hidden />Compartilhar</button>
      </div>
      <dl className="figs figs3">{figs.map(([v, l]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}</dl>

      <h2 className="sh">Metas de {ano}</h2>
      <p className="quiet" style={{ marginBottom: 12 }}>Digite o número ao lado de cada linha para definir a meta.</p>
      <GoalBars ano={ano} editable />

      <h2 className="sh">Mês a mês</h2>
      <div className="bars" role="img" aria-label="Concluídos por mês">
        {R.porMes.map((m, i) => {
          const t = m.tela + m.livros;
          return (
            <div key={i} className="bar-col" title={`${MESES[i]}: ${t}`}>
              <span className="bar-n">{t || ''}</span>
              <div className="bar-stack" style={{ height: `${Math.max(2, t / maxMes * 130)}px` }}>
                {m.livros > 0 && <i style={{ flex: m.livros, background: 'var(--c-livros)' }} />}
                {m.tela > 0 && <i style={{ flex: m.tela, background: 'var(--c-tela)' }} />}
              </div>
              <span className="bar-l">{MESES[i]}</span>
            </div>
          );
        })}
      </div>
      <p className="legend"><i style={{ background: 'var(--c-tela)' }} />Filmes & Séries <i style={{ background: 'var(--c-livros)' }} />Livros</p>

      <div className="retro-2">
        <section>
          <h2 className="sh">Notas</h2>
          <ul className="hbars">{R.notas.map((n, i) => <li key={i}><span className="stars-l">{'★'.repeat(i + 1)}</span><div className="line"><i style={{ width: `${n / maxNota * 100}%`, background: 'var(--gold)' }} /></div><b>{n}</b></li>)}</ul>
        </section>
        <section>
          <h2 className="sh">Gêneros favoritos</h2>
          {R.generos.length ? <ul className="hbars">{R.generos.map(([g, n]) => <li key={g}><span>{g}</span><div className="line"><i style={{ width: `${n / maxGen * 100}%`, background: 'var(--u)' }} /></div><b>{n}</b></li>)}</ul>
            : <p className="quiet">Use a busca automática ou preencha gêneros para ver esta parte.</p>}
        </section>
      </div>

      {R.melhores.length > 0 && <><h2 className="sh">O melhor de {ano}</h2><ul className="rows">{R.melhores.map(it => <RowItem key={it.id} it={it} mode="feito" />)}</ul></>}
      {!R.done.length && <p className="quiet" style={{ marginTop: 20 }}>Nada concluído em {ano} ainda.</p>}
    </div>
  );
}
