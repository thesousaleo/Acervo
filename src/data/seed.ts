import type { MediaItem } from '../types/media';
import { DEF, uid } from './catalog';

/** Itens de exemplo exibidos na primeira abertura (podem ser apagados em Backup). */
export function seed(): MediaItem[] {
  const mk = (o: Record<string, any>): MediaItem => {
    const it: any = { id: uid(), capaUrl: '', favorito: false, nota: 0, dataInicio: '', dataConclusao: '', review: '', ...JSON.parse(JSON.stringify(DEF[o.categoria as keyof typeof DEF])), ...o };
    it.updatedAt = Date.parse((it.dataConclusao || it.dataInicio || '2026-01-01') + 'T12:00:00') + Math.floor(Math.random() * 1000);
    return it;
  };
  return [
    mk({ titulo: 'Ruptura', categoria: 'serie', status: 'consumindo', temporadaAtual: 2, episodioAtual: 6, totalTemporadas: 2, streaming: 'Apple TV+', dataInicio: '2026-10-11', nota: 4.5 }),
    mk({ titulo: 'The Last of Us', categoria: 'serie', status: 'consumindo', temporadaAtual: 2, episodioAtual: 3, totalTemporadas: 2, streaming: 'Max', dataInicio: '2026-10-18' }),
    mk({ titulo: 'Projeto Hail Mary', categoria: 'livro', status: 'consumindo', autor: 'Andy Weir', formato: 'Kindle/E-book', paginaAtual: 214, totalPaginas: 496, dataInicio: '2026-10-14' }),
    mk({ titulo: 'Hollow Knight: Silksong', categoria: 'jogo', status: 'consumindo', plataforma: 'Switch', horasJogadas: 18, nivelConclusao: 'Jogando', dataInicio: '2026-10-02', favorito: true }),
    mk({ titulo: 'Hades II', categoria: 'jogo', status: 'consumindo', plataforma: 'PC', horasJogadas: 9, nivelConclusao: 'Jogando', dataInicio: '2026-10-20' }),
    mk({ titulo: 'Clair Obscur: Expedition 33', categoria: 'jogo', status: 'concluido', plataforma: 'PS5', horasJogadas: 52, nivelConclusao: 'História Principal', dataInicio: '2026-09-01', dataConclusao: '2026-10-19', nota: 5, favorito: true, review: 'Combate por turnos com timing de ação que nunca cansa. O ato final me pegou desprevenido.' }),
    mk({ titulo: 'Duna: Parte Dois', categoria: 'filme', status: 'concluido', diretor: 'Denis Villeneuve', ano: 2024, duracaoMin: 166, ondeAssistiu: 'Streaming', dataInicio: '2026-09-12', dataConclusao: '2026-09-12', nota: 4.5, favorito: true, historicoRewatch: ['2026-10-04'], review: 'Escala absurda, som que se sente no peito. Rever no fim de semana só confirmou.' }),
    mk({ titulo: 'Torto Arado', categoria: 'livro', status: 'concluido', autor: 'Itamar Vieira Junior', formato: 'Físico', paginaAtual: 264, totalPaginas: 264, dataInicio: '2026-09-03', dataConclusao: '2026-09-28', nota: 4.5, review: 'Prosa seca e bonita. A troca de narradora na segunda parte muda tudo.' }),
    mk({ titulo: 'Ainda Estou Aqui', categoria: 'filme', status: 'concluido', diretor: 'Walter Salles', ano: 2024, duracaoMin: 137, ondeAssistiu: 'Streaming', dataInicio: '2026-08-03', dataConclusao: '2026-08-03', nota: 5, favorito: true, review: 'Fernanda Torres segura o filme no silêncio.' }),
    mk({ titulo: 'Tudo É Rio', categoria: 'livro', status: 'concluido', autor: 'Carla Madeira', formato: 'Físico', paginaAtual: 210, totalPaginas: 210, dataInicio: '2026-07-10', dataConclusao: '2026-07-22', nota: 4, review: 'Li em dois fôlegos. Pesado e lindo.' }),
    mk({ titulo: 'Arcane', categoria: 'serie', status: 'concluido', temporadaAtual: 2, episodioAtual: 9, totalTemporadas: 2, streaming: 'Netflix', dataInicio: '2026-06-30', dataConclusao: '2026-07-14', nota: 5, review: 'Animação que parece pintura em movimento. Final à altura.' }),
    mk({ titulo: 'Oppenheimer', categoria: 'filme', status: 'concluido', diretor: 'Christopher Nolan', ano: 2023, duracaoMin: 180, ondeAssistiu: 'Mídia Física', dataInicio: '2026-06-21', dataConclusao: '2026-06-21', nota: 4 }),
    mk({ titulo: 'Elden Ring', categoria: 'jogo', status: 'concluido', plataforma: 'PC', horasJogadas: 142, nivelConclusao: '100% / Platinado', dataInicio: '2026-02-10', dataConclusao: '2026-05-02', nota: 5, review: 'Malenia em 47 tentativas. Platinado.' }),
    mk({ titulo: 'Astro Bot', categoria: 'jogo', status: 'concluido', plataforma: 'PS5', horasJogadas: 21, nivelConclusao: '100% / Platinado', dataInicio: '2026-03-02', dataConclusao: '2026-03-19', nota: 4.5, review: 'Puro charme. Platina tranquila.' }),
    mk({ titulo: 'O Urso', categoria: 'serie', status: 'pausado', temporadaAtual: 3, episodioAtual: 4, totalTemporadas: 4, streaming: 'Disney+', dataInicio: '2026-08-20', nota: 3.5 }),
    mk({ titulo: 'O Problema dos Três Corpos', categoria: 'livro', status: 'pausado', autor: 'Cixin Liu', formato: 'Audiobook', paginaAtual: 120, totalPaginas: 400, dataInicio: '2026-07-05' }),
    mk({ titulo: 'Shōgun', categoria: 'serie', status: 'wishlist', prioridade: 'Alto', totalTemporadas: 1, streaming: 'Disney+' }),
    mk({ titulo: 'Bugonia', categoria: 'filme', status: 'wishlist', prioridade: 'Alto', diretor: 'Yorgos Lanthimos', ano: 2025, ondeAssistiu: 'Cinema' }),
    mk({ titulo: 'Death Stranding 2', categoria: 'jogo', status: 'wishlist', prioridade: 'Médio', plataforma: 'PS5', horasJogadas: 0 }),
    mk({ titulo: 'Pobres Criaturas', categoria: 'filme', status: 'wishlist', prioridade: 'Médio', diretor: 'Yorgos Lanthimos', ano: 2023, duracaoMin: 141 }),
    mk({ titulo: 'Grande Sertão: Veredas', categoria: 'livro', status: 'wishlist', prioridade: 'Baixo', autor: 'Guimarães Rosa', formato: 'Físico', paginaAtual: 0, totalPaginas: 624 })
  ];
}
