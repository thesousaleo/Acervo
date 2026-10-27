import type { Categoria } from '../types/media';
import { SUPABASE_KEY, SUPABASE_URL } from './supabase';

/** Resultado de busca normalizado para qualquer tipo de mídia. */
export interface MetaHit {
  fonte: 'tmdb' | 'anilist' | 'google' | 'openlibrary';
  tipo: string; extId: string; titulo: string; ano?: string | number | null; capa: string; resumo?: string; sub?: string;
  /** campos já prontos para aplicar no item (quando a busca já traz tudo) */
  dados?: Record<string, any>;
}

async function fn(body: Record<string, any>) {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/meta`, { method: 'POST', headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error) throw new Error(d.error || `Busca indisponível (${r.status}).`);
  return d;
}

/* ---------- AniList (anime e mangá), sem chave ---------- */
const ANI_Q = `query ($q: String, $t: MediaType) { Page(perPage: 10) { media(search: $q, type: $t, sort: SEARCH_MATCH) {
  id title { romaji english native } startDate { year } coverImage { large } episodes chapters status genres
  nextAiringEpisode { airingAt episode } studios(isMain: true) { nodes { name } }
  staff(perPage: 3) { edges { role node { name { full } } } } description(asHtml: false) } } }`;
async function anilist(q: string, t: 'ANIME' | 'MANGA'): Promise<MetaHit[]> {
  const r = await fetch('https://graphql.anilist.co', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ query: ANI_Q, variables: { q, t } }) });
  if (!r.ok) throw new Error(`AniList ${r.status}`);
  const media = (await r.json()).data?.Page?.media || [];
  return media.map((m: any): MetaHit => {
    const titulo = m.title.english || m.title.romaji || m.title.native;
    const autor = (m.staff?.edges || []).filter((e: any) => /story|art|original/i.test(e.role)).map((e: any) => e.node.name.full).slice(0, 2).join(', ');
    const nx = m.nextAiringEpisode;
    const base = { generos: m.genres || [], capaUrl: m.coverImage?.large || '', ext: { fonte: 'anilist', id: String(m.id) } };
    const dados = t === 'ANIME'
      ? { ...base, titulo, totalEpisodios: m.episodes || null, estudio: m.studios?.nodes?.[0]?.name || '', emExibicao: m.status === 'RELEASING',
          proximoEp: nx ? { data: new Date(nx.airingAt * 1000).toISOString().slice(0, 10), episodio: nx.episode } : null }
      : { ...base, titulo, autor, totalCapitulos: m.chapters || null };
    return { fonte: 'anilist', tipo: t.toLowerCase(), extId: String(m.id), titulo, ano: m.startDate?.year, capa: m.coverImage?.large || '', sub: t === 'ANIME' ? (m.studios?.nodes?.[0]?.name || '') : autor, dados };
  });
}

/* ---------- Livros: Google Books com Open Library de reserva ---------- */
async function books(q: string): Promise<MetaHit[]> {
  try {
    const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=10&printType=books`);
    if (r.ok) {
      const items = (await r.json()).items || [];
      if (items.length) return items.map((b: any): MetaHit => {
        const v = b.volumeInfo || {};
        const capa = (v.imageLinks?.thumbnail || v.imageLinks?.smallThumbnail || '').replace('http://', 'https://').replace('&edge=curl', '');
        const autor = (v.authors || []).join(', ');
        return { fonte: 'google', tipo: 'livro', extId: b.id, titulo: v.title + (v.subtitle ? `: ${v.subtitle}` : ''), ano: (v.publishedDate || '').slice(0, 4), capa, sub: autor,
          dados: { titulo: v.title + (v.subtitle ? `: ${v.subtitle}` : ''), autor, totalPaginas: v.pageCount || null, generos: v.categories || [], capaUrl: capa, ext: { fonte: 'google', id: b.id } } };
      });
    }
  } catch { /* tenta a Open Library */ }
  const r = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=10&fields=key,title,author_name,first_publish_year,number_of_pages_median,cover_i,subject`);
  if (!r.ok) throw new Error(`Open Library ${r.status}`);
  return ((await r.json()).docs || []).map((b: any): MetaHit => {
    const capa = b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-L.jpg` : '';
    const autor = (b.author_name || []).slice(0, 2).join(', ');
    return { fonte: 'openlibrary', tipo: 'livro', extId: b.key, titulo: b.title, ano: b.first_publish_year, capa, sub: autor,
      dados: { titulo: b.title, autor, totalPaginas: b.number_of_pages_median || null, generos: (b.subject || []).slice(0, 4), capaUrl: capa, ext: { fonte: 'openlibrary', id: b.key } } };
  });
}

export const meta = {
  status: () => fn({ action: 'status' }) as Promise<{ tmdb: boolean }>,

  async search(cat: Categoria, q: string): Promise<MetaHit[]> {
    q = q.trim(); if (!q) return [];
    switch (cat) {
      case 'filme': return (await fn({ action: 'tmdb.search', q, type: 'movie' })).map((h: any) => ({ ...h, sub: h.original !== h.titulo ? h.original : '' }));
      case 'serie': return (await fn({ action: 'tmdb.search', q, type: 'tv' })).map((h: any) => ({ ...h, sub: h.original !== h.titulo ? h.original : '' }));
      case 'anime': return anilist(q, 'ANIME');
      case 'hq': return anilist(q, 'MANGA');
      case 'livro': return books(q);
    }
    return [];
  },

  /** Dados completos para aplicar no item (TMDB precisa de uma segunda chamada). */
  async details(cat: Categoria, hit: MetaHit): Promise<Record<string, any>> {
    if (hit.fonte !== 'tmdb') return hit.dados || {};
    const d = await fn({ action: 'tmdb.details', id: hit.extId, type: cat === 'filme' ? 'movie' : 'tv' });
    const base = { titulo: d.titulo, capaUrl: d.capa, generos: d.generos, onde: d.onde, ext: { fonte: 'tmdb', id: d.extId, tipo: d.tipo } };
    if (cat === 'filme') return { ...base, diretor: d.diretor, ano: d.ano, duracaoMin: d.duracaoMin };
    return { ...base, totalTemporadas: d.totalTemporadas, temporadas: d.temporadas, streaming: d.streaming, emExibicao: d.emExibicao, proximoEp: d.proximoEp };
  },

  /** Atualiza próximos episódios e onde assistir de séries já salvas. */
  async refresh(it: any): Promise<Record<string, any> | null> {
    if (!it.ext) return null;
    if (it.ext.fonte === 'tmdb' && it.categoria === 'serie') {
      const d = await fn({ action: 'tmdb.details', id: it.ext.id, type: 'tv' });
      return { temporadas: d.temporadas, totalTemporadas: d.totalTemporadas, proximoEp: d.proximoEp, emExibicao: d.emExibicao, onde: d.onde };
    }
    if (it.ext.fonte === 'tmdb' && it.categoria === 'filme') {
      const d = await fn({ action: 'tmdb.details', id: it.ext.id, type: 'movie' });
      return { onde: d.onde };
    }
    if (it.ext.fonte === 'anilist' && it.categoria === 'anime') {
      const hits = await anilist(it.titulo, 'ANIME');
      const h = hits.find(x => x.extId === it.ext.id);
      return h ? { proximoEp: h.dados!.proximoEp, emExibicao: h.dados!.emExibicao, totalEpisodios: h.dados!.totalEpisodios || it.totalEpisodios } : null;
    }
    return null;
  }
};
