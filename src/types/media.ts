export type Categoria = 'filme' | 'serie' | 'anime' | 'livro' | 'hq';
export type Status = 'consumindo' | 'concluido' | 'wishlist' | 'pausado' | 'abandonado';
export type Universo = 'tela' | 'livros';
export type UniversoFiltro = Universo | 'todos';
export type Prioridade = 'Baixo' | 'Médio' | 'Alto';

export interface Provedor { nome: string; logo: string; tipo: string }
export interface OndeAssistir { link: string; lista: Provedor[] }
export interface Sessao { data: string; ts: number; acao: string; nota?: string }
export interface ProximoEp { data: string; temporada?: number; episodio: number; nome?: string }

export interface BaseItem {
  id: string;
  titulo: string;
  categoria: Categoria;
  capaUrl: string;
  status: Status;
  /** 0 a 5, passos de 0.5 */
  nota: number;
  favorito: boolean;
  dataInicio: string;      // YYYY-MM-DD
  dataConclusao: string;   // YYYY-MM-DD
  review: string;
  updatedAt: number;       // epoch ms
  prioridade?: Prioridade; // só para wishlist
  deletedAt?: number;      // marca de exclusão (sincronização)
  generos?: string[];
  tags?: string[];
  listas?: string[];
  /** datas em que reviu / releu */
  historicoRewatch?: string[];
  /** registro de sessões (cada +1 ep, página, +1 h…) */
  sessoes?: Sessao[];
  /** origem dos dados (busca automática) */
  ext?: { fonte: string; id: string } | null;
  onde?: OndeAssistir | null;
}

export interface Filme extends BaseItem { categoria: 'filme'; diretor: string; ano: number | null; duracaoMin: number | null; ondeAssistiu: 'Cinema' | 'Streaming' | 'Mídia Física' }
export interface Serie extends BaseItem { categoria: 'serie'; temporadaAtual: number | null; episodioAtual: number | null; totalTemporadas: number | null; streaming: string; temporadas?: number[]; proximoEp?: ProximoEp | null; emExibicao?: boolean }
export interface Anime extends BaseItem { categoria: 'anime'; episodioAtual: number | null; totalEpisodios: number | null; estudio: string; streaming: string; proximoEp?: ProximoEp | null; emExibicao?: boolean }
export interface Livro extends BaseItem { categoria: 'livro'; autor: string; formato: 'Físico' | 'Kindle/E-book' | 'Audiobook'; paginaAtual: number | null; totalPaginas: number | null }
export interface Hq extends BaseItem { categoria: 'hq'; autor: string; formato: 'Mangá' | 'HQ' | 'Webtoon'; capituloAtual: number | null; totalCapitulos: number | null }

export type MediaItem = Filme | Serie | Anime | Livro | Hq;
/** Forma solta usada no formulário (campos de todas as categorias). */
export type Draft = BaseItem & Record<string, any>;

export interface Metas { ano: string; filmes?: number; series?: number; livros?: number; paginas?: number }
export interface Config { metas: Metas[]; updatedAt: number }
