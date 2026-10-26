import type { Categoria, Draft, MediaItem, Status, Universo } from '../types/media';

export const CATS: Record<Categoria, { label: string; plural: string; verb: string; color: string }> = {
  filme: { label: 'Filme', plural: 'Filmes', verb: 'Assistindo', color: '#FB7185' },
  serie: { label: 'Série', plural: 'Séries', verb: 'Assistindo', color: '#F9A8D4' },
  livro: { label: 'Livro', plural: 'Livros', verb: 'Lendo', color: '#FBCB5A' },
  jogo:  { label: 'Jogo',  plural: 'Jogos',  verb: 'Jogando', color: '#A78BFA' }
};

export const GROUPS: Record<Universo, { label: string; short: string; cats: Categoria[]; color: string; def: Categoria; hello: string; search: string }> = {
  tela:   { label: 'Filmes & Séries', short: 'Filmes/Séries', cats: ['filme', 'serie'], color: '#FB7185', def: 'filme', hello: 'O que está passando na sua tela.', search: 'Buscar filme, série, diretor, streaming…' },
  jogos:  { label: 'Jogos', short: 'Jogos', cats: ['jogo'], color: '#A78BFA', def: 'jogo', hello: 'No controle agora.', search: 'Buscar jogo ou plataforma…' },
  livros: { label: 'Livros', short: 'Livros', cats: ['livro'], color: '#FBCB5A', def: 'livro', hello: 'Na cabeceira agora.', search: 'Buscar livro ou autor…' }
};
export const ORDER: Universo[] = ['tela', 'jogos', 'livros'];

export const STATUS: Record<Status, string> = { consumindo: 'Consumindo', concluido: 'Concluído', wishlist: 'Wishlist', pausado: 'Pausado' };
export const PRI: Record<string, number> = { Alto: 3, 'Médio': 2, Baixo: 1 };
export const PLAT: Record<string, string> = { PS5: '#2563EB', 'Xbox Series': '#15803D', Switch: '#DC2626', PC: '#475569', Mobile: '#0891B2', Outro: '#6B7280' };

type Spec = [key: string, label: string, type: 'text' | 'number' | string[]];
export const SPEC: Record<Categoria, Spec[]> = {
  filme: [['diretor', 'Diretor', 'text'], ['ano', 'Ano', 'number'], ['duracaoMin', 'Duração (min)', 'number'], ['ondeAssistiu', 'Onde assistiu', ['Cinema', 'Streaming', 'Mídia Física']]],
  serie: [['temporadaAtual', 'Temporada atual', 'number'], ['episodioAtual', 'Episódio atual', 'number'], ['totalTemporadas', 'Total de temporadas', 'number'], ['streaming', 'Streaming', 'text']],
  livro: [['autor', 'Autor', 'text'], ['formato', 'Formato', ['Físico', 'Kindle/E-book', 'Audiobook']], ['paginaAtual', 'Página atual', 'number'], ['totalPaginas', 'Total de páginas', 'number']],
  jogo:  [['plataforma', 'Plataforma', ['PC', 'PS5', 'Xbox Series', 'Switch', 'Mobile', 'Outro']], ['horasJogadas', 'Horas jogadas', 'number'], ['nivelConclusao', 'Nível de conclusão', ['Jogando', 'História Principal', '100% / Platinado', 'New Game+']]]
};
export const DEF: Record<Categoria, Record<string, any>> = {
  filme: { diretor: '', ano: null, duracaoMin: null, ondeAssistiu: 'Streaming', historicoRewatch: [] },
  serie: { temporadaAtual: 1, episodioAtual: 1, totalTemporadas: 1, streaming: '' },
  livro: { autor: '', formato: 'Físico', paginaAtual: 0, totalPaginas: null },
  jogo:  { plataforma: 'PC', horasJogadas: 0, nivelConclusao: 'Jogando' }
};
const COMMON = ['id', 'titulo', 'categoria', 'capaUrl', 'status', 'nota', 'favorito', 'dataInicio', 'dataConclusao', 'review', 'updatedAt', 'prioridade', 'deletedAt'];
export const NUM = new Set(['nota', 'ano', 'duracaoMin', 'temporadaAtual', 'episodioAtual', 'totalTemporadas', 'paginaAtual', 'totalPaginas', 'horasJogadas']);

export const uniOf = (it: { categoria: Categoria }): Universo => it.categoria === 'jogo' ? 'jogos' : it.categoria === 'livro' ? 'livros' : 'tela';

export const uid = (): string =>
  (globalThis.crypto && 'randomUUID' in globalThis.crypto) ? globalThis.crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);

/** Mantém só os campos válidos da categoria e preenche os que faltam. */
export function clean(d: Draft): MediaItem {
  const def = DEF[d.categoria];
  const keep = new Set([...COMMON, ...Object.keys(def)]);
  const o: Record<string, any> = {};
  for (const k of keep) {
    const v = d[k];
    if (k === 'deletedAt') { if (v) o[k] = v; continue; }
    o[k] = v ?? (def[k] !== undefined ? structuredCopy(def[k]) : k === 'favorito' ? false : k === 'nota' ? 0 : k === 'updatedAt' ? Date.now() : '');
  }
  if (!o.id) o.id = uid();
  if (o.status !== 'wishlist') delete o.prioridade;
  return o as MediaItem;
}
const structuredCopy = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

export function blank(cat: Categoria, status: Status): Draft {
  return { id: uid(), titulo: '', categoria: cat, capaUrl: '', status, nota: 0, favorito: false, dataInicio: '', dataConclusao: '', review: '', updatedAt: Date.now(), prioridade: 'Médio', ...structuredCopy(DEF[cat]) };
}
