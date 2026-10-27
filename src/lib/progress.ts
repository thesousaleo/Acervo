import { CATS, STATUS, uniOf } from '../data/catalog';
import type { MediaItem, Universo } from '../types/media';
import { asDate, today, yearNow } from './dates';

export function sub(it: any): string {
  switch (it.categoria) {
    case 'filme': return [it.diretor, it.ano].filter(Boolean).join(' · ');
    case 'serie': return [it.streaming, it.totalTemporadas ? `${it.totalTemporadas} temp.` : ''].filter(Boolean).join(' · ');
    case 'anime': return [it.estudio, it.totalEpisodios ? `${it.totalEpisodios} ep.` : ''].filter(Boolean).join(' · ');
    case 'livro': return [it.autor, it.formato].filter(Boolean).join(' · ');
    case 'hq':    return [it.autor, it.formato].filter(Boolean).join(' · ');
  }
  return '';
}
export const statusLabel = (it: MediaItem) => it.status === 'consumindo' ? CATS[it.categoria].verb : STATUS[it.status];

const sum = (a: number[]) => a.reduce((x, y) => x + (+y || 0), 0);

/** Episódios vistos / total de uma série, usando a lista de episódios por temporada quando existir. */
export function serieCount(it: any): { visto: number; total: number } | null {
  const t: number[] = Array.isArray(it.temporadas) ? it.temporadas : [];
  if (!t.length) return null;
  const s = Math.max(1, +it.temporadaAtual || 1), e = Math.max(0, +it.episodioAtual || 0);
  return { visto: Math.min(sum(t), sum(t.slice(0, s - 1)) + e), total: sum(t) };
}

export function progress(it: any): { pct: number | null; l: string; r: string } {
  switch (it.categoria) {
    case 'serie': {
      const s = +it.temporadaAtual || 1, e = +it.episodioAtual || 0;
      const c = serieCount(it);
      if (c) return { pct: c.total ? c.visto / c.total * 100 : 0, l: `T${s} · E${e}`, r: `${c.visto}/${c.total} ep` };
      const t = Math.max(1, +it.totalTemporadas || 1);
      return { pct: Math.min(100, s / t * 100), l: `T${s} · E${e}`, r: `temporada ${s} de ${t}` };
    }
    case 'anime': { const e = +it.episodioAtual || 0, t = +it.totalEpisodios || 0; return { pct: t ? Math.min(100, e / t * 100) : null, l: `ep. ${e}${t ? ' / ' + t : ''}`, r: t ? Math.round(e / t * 100) + '%' : '' }; }
    case 'livro': { const p = +it.paginaAtual || 0, t = +it.totalPaginas || 0; return { pct: t ? Math.min(100, p / t * 100) : 0, l: `pág. ${p}${t ? ' / ' + t : ''}`, r: t ? Math.round(p / t * 100) + '%' : '' }; }
    case 'hq':    { const p = +it.capituloAtual || 0, t = +it.totalCapitulos || 0; return { pct: t ? Math.min(100, p / t * 100) : null, l: `cap. ${p}${t ? ' / ' + t : ''}`, r: t ? Math.round(p / t * 100) + '%' : '' }; }
  }
  return { pct: null, l: it.duracaoMin ? `${it.duracaoMin} min` : '', r: it.ondeAssistiu || '' };
}

const daysBetween = (a: string, b: string) => Math.max(1, Math.round((asDate(b).getTime() - asDate(a).getTime()) / 86400000) + 1);

/** "Quanto falta" em linguagem simples. */
export function remaining(it: any): string {
  if (it.status === 'concluido') return '';
  switch (it.categoria) {
    case 'serie': { const c = serieCount(it); return c ? (c.total - c.visto > 0 ? `faltam ${c.total - c.visto} episódios` : 'em dia') : ''; }
    case 'anime': { const t = +it.totalEpisodios || 0, e = +it.episodioAtual || 0; return t ? (t - e > 0 ? `faltam ${t - e} episódios` : 'em dia') : ''; }
    case 'livro': case 'hq': {
      const isL = it.categoria === 'livro';
      const cur = +(isL ? it.paginaAtual : it.capituloAtual) || 0, tot = +(isL ? it.totalPaginas : it.totalCapitulos) || 0;
      if (!tot) return '';
      const left = tot - cur; if (left <= 0) return 'na última página';
      const un = isL ? 'páginas' : 'capítulos';
      if (!it.dataInicio || cur <= 0) return `faltam ${left} ${un}`;
      const pace = cur / daysBetween(it.dataInicio, today());
      const d = Math.ceil(left / Math.max(pace, 0.01));
      return `faltam ${left} ${un} · no seu ritmo, ~${d} ${d === 1 ? 'dia' : 'dias'}`;
    }
  }
  return '';
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
    const seriesY = L.filter(i => i.categoria !== 'filme' && inY(i)).length;
    const min = films.reduce((a, i) => a + ((inY(i) ? 1 : 0) + rwY(i)) * (+i.duracaoMin || 0), 0);
    return { now, nowLabel: 'Assistindo agora', foot: `${filmsY} sessões de filme e ${seriesY} ${seriesY === 1 ? 'série concluída' : 'séries concluídas'} em ${y}`,
      stats: [[now, '', 'Assistindo agora'], [filmsY, '', `Sessões de filme em ${y}`], [seriesY, '', `Séries/animes concluídos em ${y}`], [Math.round(min / 60), 'h', `De filme em ${y}`]] };
  }
  const pages = L.filter(i => i.categoria === 'livro').reduce((a, i) => a + (+i.paginaAtual || 0), 0);
  const lidos = L.filter(inY).length;
  return { now, nowLabel: 'Lendo agora', foot: `${lidos} ${lidos === 1 ? 'lido' : 'lidos'} em ${y} · ${pages.toLocaleString('pt-BR')} páginas`,
    stats: [[now, '', 'Lendo agora'], [lidos, '', `Lidos em ${y}`], [pages.toLocaleString('pt-BR'), '', 'Páginas lidas'], [queue, '', 'Na fila']] };
}
