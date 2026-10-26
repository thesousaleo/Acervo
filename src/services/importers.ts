import type { MediaItem } from '../types/media';
import { clean } from '../data/catalog';

/** CSV simples com aspas (RFC 4180). */
export function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = []; let row: string[] = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  const [head, ...body] = rows.filter(r => r.some(x => x.trim()));
  if (!head) return [];
  const h = head.map(x => x.trim().replace(/^﻿/, ''));
  return body.map(r => Object.fromEntries(h.map((k, i) => [k, (r[i] ?? '').trim()])));
}

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const gdate = (s: string) => s ? s.replace(/\//g, '-').slice(0, 10) : '';

/** Letterboxd: diary.csv, watched.csv, ratings.csv, reviews.csv ou watchlist.csv. */
function letterboxd(rows: Record<string, string>[], watchlist: boolean): MediaItem[] {
  const byId = new Map<string, any>();
  for (const r of rows) {
    if (!r.Name) continue;
    const id = 'lb-' + slug(r.Name + '-' + (r.Year || ''));
    const prev = byId.get(id);
    const quando = r['Watched Date'] || r.Date || '';
    const it = prev || { id, titulo: r.Name, categoria: 'filme', ano: Number(r.Year) || null, status: watchlist ? 'wishlist' : 'concluido', prioridade: 'Médio', updatedAt: Date.now(), historicoRewatch: [], tags: [], review: '' };
    if (!watchlist) {
      if (r.Rating) it.nota = Math.max(it.nota || 0, Number(r.Rating) || 0);
      if (r.Review) it.review = r.Review;
      if (r.Tags) it.tags = [...new Set([...(it.tags || []), ...r.Tags.split(',').map((t: string) => t.trim()).filter(Boolean)])];
      if (r.Rewatch === 'Yes' && quando) it.historicoRewatch.push(quando);
      else if (quando && (!it.dataConclusao || quando < it.dataConclusao)) { it.dataConclusao = quando; it.dataInicio = quando; }
    }
    byId.set(id, it);
  }
  return [...byId.values()].map(x => clean(x));
}

/** Goodreads: goodreads_library_export.csv */
function goodreads(rows: Record<string, string>[]): MediaItem[] {
  return rows.filter(r => r.Title).map(r => {
    const shelf = r['Exclusive Shelf'];
    const status = shelf === 'read' ? 'concluido' : shelf === 'currently-reading' ? 'consumindo' : 'wishlist';
    const pages = Number(r['Number of Pages']) || null;
    const lists = (r.Bookshelves || '').split(',').map(s => s.trim()).filter(s => s && !['read', 'to-read', 'currently-reading'].includes(s));
    return clean({
      id: 'gr-' + (r['Book Id'] || slug(r.Title)), titulo: r.Title, categoria: 'livro', autor: r.Author || '', formato: 'Físico',
      status, prioridade: 'Médio', nota: Number(r['My Rating']) || 0, totalPaginas: pages, paginaAtual: status === 'concluido' ? pages || 0 : 0,
      dataConclusao: status === 'concluido' ? gdate(r['Date Read']) : '', dataInicio: gdate(r['Date Read'] || r['Date Added']),
      review: r['My Review'] || '', listas: lists, updatedAt: Date.now()
    } as any);
  });
}

export function importCSV(name: string, text: string): { origem: string; items: MediaItem[] } {
  const rows = parseCSV(text);
  if (!rows.length) throw new Error('O arquivo está vazio ou não é um CSV.');
  const cols = Object.keys(rows[0]);
  if (cols.includes('Exclusive Shelf') && cols.includes('Title')) return { origem: 'Goodreads', items: goodreads(rows) };
  if (cols.includes('Name') && cols.includes('Letterboxd URI')) return { origem: 'Letterboxd', items: letterboxd(rows, /watchlist/i.test(name)) };
  throw new Error('Não reconheci esse CSV. Use a exportação do Letterboxd (diary.csv, watched.csv, ratings.csv, reviews.csv ou watchlist.csv) ou do Goodreads.');
}
