import type { Categoria, Draft, MediaItem, Status, Universo } from '../types/media';

export const CATS: Record<Categoria, { label: string; plural: string; verb: string; color: string; repetir: string }> = {
  filme: { label: 'Filme', plural: 'Filmes', verb: 'Assistindo', color: '#FB7185', repetir: 'Revi hoje' },
  serie: { label: 'Série', plural: 'Séries', verb: 'Assistindo', color: '#F9A8D4', repetir: 'Revi hoje' },
  anime: { label: 'Anime', plural: 'Animes', verb: 'Assistindo', color: '#F0ABFC', repetir: 'Revi hoje' },
  livro: { label: 'Livro', plural: 'Livros', verb: 'Lendo', color: '#FBCB5A', repetir: 'Reli hoje' },
  hq:    { label: 'Mangá/HQ', plural: 'Mangás e HQs', verb: 'Lendo', color: '#FCD9A0', repetir: 'Reli hoje' }
};
export const CAT_ORDER: Categoria[] = ['filme', 'serie', 'anime', 'livro', 'hq'];

export const GROUPS: Record<Universo, { label: string; short: string; cats: Categoria[]; color: string; def: Categoria; hello: string; search: string }> = {
  tela:   { label: 'Filmes & Séries', short: 'Filmes/Séries', cats: ['filme', 'serie', 'anime'], color: '#FB7185', def: 'filme', hello: 'O que está passando na sua tela.', search: 'Buscar filme, série, anime, diretor…' },
  livros: { label: 'Livros', short: 'Livros', cats: ['livro', 'hq'], color: '#FBCB5A', def: 'livro', hello: 'Na cabeceira agora.', search: 'Buscar livro, mangá ou autor…' }
};
export const ORDER: Universo[] = ['tela', 'livros'];

export const STATUS: Record<Status, string> = { consumindo: 'Consumindo', concluido: 'Concluído', wishlist: 'Na fila', pausado: 'Pausado', abandonado: 'Abandonado' };
export const PRI: Record<string, number> = { Alto: 3, 'Médio': 2, Baixo: 1 };
export const TAGS_SUGERIDAS = ['leve', 'intenso', 'emocionante', 'engraçado', 'sombrio', 'reflexivo', 'aconchegante', 'ritmo rápido', 'ritmo lento', 'para rever'];

type Spec = [key: string, label: string, type: 'text' | 'number' | string[]];
export const SPEC: Record<Categoria, Spec[]> = {
  filme: [['diretor', 'Diretor', 'text'], ['ano', 'Ano', 'number'], ['duracaoMin', 'Duração (min)', 'number'], ['ondeAssistiu', 'Onde assistiu', ['Cinema', 'Streaming', 'Mídia Física']]],
  serie: [['temporadaAtual', 'Temporada atual', 'number'], ['episodioAtual', 'Último episódio visto', 'number'], ['totalTemporadas', 'Total de temporadas', 'number'], ['streaming', 'Streaming', 'text']],
  anime: [['episodioAtual', 'Último episódio visto', 'number'], ['totalEpisodios', 'Total de episódios', 'number'], ['estudio', 'Estúdio', 'text'], ['streaming', 'Streaming', 'text']],
  livro: [['autor', 'Autor', 'text'], ['formato', 'Formato', ['Físico', 'Kindle/E-book', 'Audiobook']], ['paginaAtual', 'Página atual', 'number'], ['totalPaginas', 'Total de páginas', 'number']],
  hq:    [['autor', 'Autor', 'text'], ['formato', 'Formato', ['Mangá', 'HQ', 'Webtoon']], ['capituloAtual', 'Capítulo atual', 'number'], ['totalCapitulos', 'Total de capítulos', 'number']]
};
export const DEF: Record<Categoria, Record<string, any>> = {
  filme: { diretor: '', ano: null, duracaoMin: null, ondeAssistiu: 'Streaming' },
  serie: { temporadaAtual: 1, episodioAtual: 0, totalTemporadas: 1, streaming: '', temporadas: [], proximoEp: null, emExibicao: false },
  anime: { episodioAtual: 0, totalEpisodios: null, estudio: '', streaming: '', proximoEp: null, emExibicao: false },
  livro: { autor: '', formato: 'Físico', paginaAtual: 0, totalPaginas: null },
  hq:    { autor: '', formato: 'Mangá', capituloAtual: 0, totalCapitulos: null }
};
const COMMON = ['id', 'titulo', 'categoria', 'capaUrl', 'status', 'nota', 'favorito', 'dataInicio', 'dataConclusao', 'review', 'updatedAt', 'prioridade', 'deletedAt', 'generos', 'tags', 'listas', 'historicoRewatch', 'sessoes', 'ext', 'onde'];
const OPTIONAL = new Set(['prioridade', 'deletedAt', 'ext', 'onde']);
const ARRAYS = new Set(['generos', 'tags', 'listas', 'historicoRewatch', 'sessoes']);
export const NUM = new Set(['nota', 'ano', 'duracaoMin', 'temporadaAtual', 'episodioAtual', 'totalTemporadas', 'totalEpisodios', 'paginaAtual', 'totalPaginas', 'capituloAtual', 'totalCapitulos']);

export const uniOf = (it: { categoria: Categoria }): Universo =>
  (it.categoria === 'livro' || it.categoria === 'hq') ? 'livros' : 'tela';

/** Jogos saíram do Acervo: qualquer jogo salvo vira marca de exclusão (some de todos os aparelhos, mas a linha fica no banco). */
export const isGame = (it: { categoria: string }) => it.categoria === 'jogo';
export function purgeGames<T extends { categoria: string; deletedAt?: number; updatedAt: number }>(list: T[]): T[] {
  return list.map(it => isGame(it) && !it.deletedAt ? { ...it, deletedAt: Date.now(), updatedAt: Date.now() } : it);
}

export const uid = (): string =>
  (globalThis.crypto && 'randomUUID' in globalThis.crypto) ? globalThis.crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);

const copy = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

/** Mantém só os campos válidos da categoria e preenche os que faltam. */
export function clean(d: Draft): MediaItem {
  const def = DEF[d.categoria] || DEF.filme;
  const keep = new Set([...COMMON, ...Object.keys(def)]);
  const o: Record<string, any> = {};
  for (const k of keep) {
    const v = d[k];
    if (OPTIONAL.has(k)) { if (v !== undefined && v !== null && v !== '') o[k] = v; continue; }
    if (ARRAYS.has(k)) { o[k] = Array.isArray(v) ? v : []; continue; }
    o[k] = v ?? (def[k] !== undefined ? copy(def[k]) : k === 'favorito' ? false : k === 'nota' ? 0 : k === 'updatedAt' ? Date.now() : '');
  }
  if (!o.id) o.id = uid();
  if (o.status !== 'wishlist') delete o.prioridade;
  return o as MediaItem;
}

export function blank(cat: Categoria, status: Status): Draft {
  return { id: uid(), titulo: '', categoria: cat, capaUrl: '', status, nota: 0, favorito: false, dataInicio: '', dataConclusao: '', review: '', updatedAt: Date.now(), prioridade: 'Médio', generos: [], tags: [], listas: [], historicoRewatch: [], sessoes: [], ...copy(DEF[cat]) };
}
