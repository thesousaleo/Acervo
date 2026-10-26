import { Book, Clapperboard, Film, Gamepad2, Layers, Tv, type LucideIcon } from 'lucide-react';
import type { Categoria, UniversoFiltro } from '../types/media';

export const CAT_ICON: Record<Categoria, LucideIcon> = { filme: Film, serie: Tv, livro: Book, jogo: Gamepad2 };
export const GROUP_ICON: Record<UniversoFiltro, LucideIcon> = { todos: Layers, tela: Clapperboard, jogos: Gamepad2, livros: Book };
