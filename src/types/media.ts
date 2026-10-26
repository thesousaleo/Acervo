export type Categoria = 'filme' | 'serie' | 'livro' | 'jogo';
export type Status = 'consumindo' | 'concluido' | 'wishlist' | 'pausado';
export type Universo = 'tela' | 'jogos' | 'livros';
export type UniversoFiltro = Universo | 'todos';
export type Prioridade = 'Baixo' | 'Médio' | 'Alto';

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
  /** só para status = wishlist */
  prioridade?: Prioridade;
}

export interface Filme extends BaseItem {
  categoria: 'filme';
  diretor: string;
  ano: number | null;
  duracaoMin: number | null;
  ondeAssistiu: 'Cinema' | 'Streaming' | 'Mídia Física';
  historicoRewatch: string[];
}
export interface Serie extends BaseItem {
  categoria: 'serie';
  temporadaAtual: number | null;
  episodioAtual: number | null;
  totalTemporadas: number | null;
  streaming: string;
}
export interface Livro extends BaseItem {
  categoria: 'livro';
  autor: string;
  formato: 'Físico' | 'Kindle/E-book' | 'Audiobook';
  paginaAtual: number | null;
  totalPaginas: number | null;
}
export interface Jogo extends BaseItem {
  categoria: 'jogo';
  plataforma: string;
  horasJogadas: number | null;
  nivelConclusao: 'Jogando' | 'História Principal' | '100% / Platinado' | 'New Game+';
}

export type MediaItem = Filme | Serie | Livro | Jogo;
/** Forma solta usada no formulário (campos de todas as categorias). */
export type Draft = BaseItem & Record<string, any>;
