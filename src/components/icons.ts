import { Book, BookOpen, Clapperboard, Film, Layers, Sparkles, Tv, type LucideIcon } from 'lucide-react';
import type { Categoria, UniversoFiltro } from '../types/media';

export const CAT_ICON: Record<Categoria, LucideIcon> = { filme: Film, serie: Tv, anime: Sparkles, livro: Book, hq: BookOpen };
export const GROUP_ICON: Record<UniversoFiltro, LucideIcon> = { todos: Layers, tela: Clapperboard, livros: Book };
