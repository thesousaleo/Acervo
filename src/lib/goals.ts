import type { Config, MediaItem, Metas } from '../types/media';

export type GoalKey = 'filmes' | 'series' | 'livros' | 'jogos' | 'paginas';
export const GOALS: [GoalKey, string, string][] = [
  ['filmes', 'Filmes', '#FB7185'], ['series', 'Séries e animes', '#F9A8D4'], ['jogos', 'Jogos zerados', '#A78BFA'], ['livros', 'Livros e mangás', '#FBCB5A'], ['paginas', 'Páginas lidas', '#FCD9A0']
];

/** Quanto já foi feito de cada meta no ano. */
export function goalProgress(items: MediaItem[], ano: string): Record<GoalKey, number> {
  const done = (i: MediaItem) => i.status === 'concluido' && (i.dataConclusao || '').startsWith(ano);
  const rw = (i: MediaItem) => (i.historicoRewatch || []).filter(d => d.startsWith(ano)).length;
  return {
    filmes: items.filter(i => i.categoria === 'filme').reduce((a, i) => a + (done(i) ? 1 : 0) + rw(i), 0),
    series: items.filter(i => (i.categoria === 'serie' || i.categoria === 'anime') && done(i)).length,
    jogos: items.filter(i => i.categoria === 'jogo' && done(i)).length,
    livros: items.filter(i => (i.categoria === 'livro' || i.categoria === 'hq') && done(i)).length,
    paginas: items.filter(i => i.categoria === 'livro' && done(i)).reduce((a, i: any) => a + (+i.totalPaginas || +i.paginaAtual || 0), 0)
  };
}
export const metasDo = (c: Config, ano: string): Metas => c.metas.find(m => m.ano === ano) || { ano };
