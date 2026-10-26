import { CATS, STATUS, uniOf } from '../data/catalog';
import type { MediaItem, Universo } from '../types/media';
import { yearNow } from './dates';

export function sub(it: any): string {
  switch (it.categoria) {
    case 'filme': return [it.diretor, it.ano].filter(Boolean).join(' · ');
    case 'serie': return [it.streaming, it.totalTemporadas ? `${it.totalTemporadas} temp.` : ''].filter(Boolean).join(' · ');
    case 'livro': return [it.autor, it.formato].filter(Boolean).join(' · ');
    case 'jogo':  return [it.plataforma, it.status === 'wishlist' ? '' : it.nivelConclusao].filter(Boolean).join(' · ');
  }
  return '';
}
export const statusLabel = (it: MediaItem) => it.status === 'consumindo' ? CATS[it.categoria].verb : STATUS[it.status];

export function progress(it: any): { pct: number | null; l: string; r: string } {
  if (it.categoria === 'serie') { const t = Math.max(1, +it.totalTemporadas || 1), s = +it.temporadaAtual || 1, e = +it.episodioAtual || 1; return { pct: Math.min(100, s / t * 100), l: `T${s} · E${e}`, r: `temporada ${s} de ${t}` }; }
  if (it.categoria === 'livro') { const p = +it.paginaAtual || 0, t = +it.totalPaginas || 0; return { pct: t ? Math.min(100, p / t * 100) : 0, l: `pág. ${p}${t ? ' / ' + t : ''}`, r: t ? Math.round(p / t * 100) + '%' : '' }; }
  if (it.categoria === 'jogo') return { pct: null, l: `${+it.horasJogadas || 0} h jogadas`, r: it.nivelConclusao || '' };
  return { pct: null, l: it.duracaoMin ? `${it.duracaoMin} min` : '', r: it.ondeAssistiu || '' };
}

export const byUpd = (a: MediaItem, b: MediaItem) => (b.updatedAt || 0) - (a.updatedAt || 0);
export const byDone = (a: MediaItem, b: MediaItem) => (b.dataConclusao || '').localeCompare(a.dataConclusao || '');

export function hue(s: string) { let h = 0; for (const ch of s) h = (h * 31 + (ch.codePointAt(0) || 0)) % 360; return h; }

export interface UStats { now: number; nowLabel: string; foot: string; stats: [string | number, string, string][] }
export function uStats(items: MediaItem[], u: Universo): UStats {
  const y = yearNow(), L: any[] = items.filter(i => uniOf(i) === u);
  const inY = (i: any) => i.status === 'concluido' && (i.dataConclusao || '').startsWith(y);
  const now = L.filter(i => i.status === 'consumindo').length;
  const queue = L.filter(i => i.status === 'wishlist').length;
  if (u === 'tela') {
    const films = L.filter(i => i.categoria === 'filme');
    const rwY = (i: any) => (i.historicoRewatch || []).filter((d: string) => d.startsWith(y)).length;
    const filmsY = films.filter(inY).length + films.reduce((a, i) => a + rwY(i), 0);
    const seriesY = L.filter(i => i.categoria === 'serie' && inY(i)).length;
    const min = films.reduce((a, i) => a + ((inY(i) ? 1 : 0) + rwY(i)) * (+i.duracaoMin || 0), 0);
    return { now, nowLabel: 'Assistindo agora', foot: `${filmsY} sessões de filme e ${seriesY} ${seriesY === 1 ? 'série concluída' : 'séries concluídas'} em ${y}`,
      stats: [[now, '', 'Assistindo agora'], [filmsY, '', `Sessões de filme em ${y}`], [seriesY, '', `Séries concluídas em ${y}`], [Math.round(min / 60), 'h', `De filme em ${y}`]] };
  }
  if (u === 'jogos') {
    const hours = L.reduce((a, i) => a + (+i.horasJogadas || 0), 0);
    const plat = L.filter(i => i.nivelConclusao === '100% / Platinado').length;
    const zer = L.filter(inY).length;
    return { now, nowLabel: 'Jogando agora', foot: `${zer} ${zer === 1 ? 'zerado' : 'zerados'} em ${y} · ${hours} h no total`,
      stats: [[now, '', 'Jogando agora'], [zer, '', `Zerados em ${y}`], [hours, 'h', 'Horas jogadas'], [plat, '', 'Platinados / 100%']] };
  }
  const pages = L.reduce((a, i) => a + (+i.paginaAtual || 0), 0);
  const lidos = L.filter(inY).length;
  return { now, nowLabel: 'Lendo agora', foot: `${lidos} ${lidos === 1 ? 'lido' : 'lidos'} em ${y} · ${pages.toLocaleString('pt-BR')} páginas`,
    stats: [[now, '', 'Lendo agora'], [lidos, '', `Lidos em ${y}`], [pages.toLocaleString('pt-BR'), '', 'Páginas lidas'], [queue, '', 'Na fila']] };
}
