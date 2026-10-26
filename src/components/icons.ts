import { Book, BookOpen, Clapperboard, Film, Gamepad2, Layers, Sparkles, Tv, type LucideIcon } from 'lucide-react';
import type { Categoria, UniversoFiltro } from '../types/media';

export const CAT_ICON: Record<Categoria, LucideIcon> = { filme: Film, serie: Tv, anime: Sparkles, livro: Book, hq: BookOpen, jogo: Gamepad2 };
export const GROUP_ICON: Record<UniversoFiltro, LucideIcon> = { todos: Layers, tela: Clapperboard, jogos: Gamepad2, livros: Book };
