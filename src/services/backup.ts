import { Capacitor } from '@capacitor/core';
import type { MediaItem } from '../types/media';
import { CATS, clean, uid } from '../data/catalog';

export function toJSON(items: MediaItem[]): string {
  return JSON.stringify({ app: 'acervo', version: 1, exportedAt: new Date().toISOString(), items }, null, 2);
}

/** Salva o backup: download no navegador, menu "Compartilhar" no Android. */
export async function exportFile(items: MediaItem[]): Promise<'download' | 'share'> {
  const json = toJSON(items);
  const name = `acervo-backup-${new Date().toISOString().slice(0, 10)}.json`;
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const res = await Filesystem.writeFile({ path: name, data: json, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: 'Backup do Acervo', files: [res.uri], dialogTitle: 'Salvar backup' });
    return 'share';
  }
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'download';
}

export class ImportError extends Error {}

export function parseBackup(raw: string): MediaItem[] {
  if (!raw.trim()) throw new ImportError('Cole um JSON ou escolha um arquivo antes de importar.');
  let data: any;
  try { data = JSON.parse(raw); } catch { throw new ImportError('O conteúdo não é um JSON válido. Confira se o arquivo veio inteiro.'); }
  const arr = Array.isArray(data) ? data : data?.items;
  if (!Array.isArray(arr)) throw new ImportError('Não encontrei a lista "items" no JSON.');
  const valid = arr.filter(x => x && x.titulo && (CATS as any)[x.categoria])
    .map(x => clean({ id: uid(), status: 'wishlist', nota: 0, favorito: false, updatedAt: Date.now(), ...x }));
  if (!valid.length) throw new ImportError('Nenhum item válido: cada item precisa de "titulo" e "categoria".');
  return valid;
}

/** Mescla mantendo a versão mais recente (updatedAt) de cada id. */
export function merge(current: MediaItem[], incoming: MediaItem[]): MediaItem[] {
  const out = [...current];
  for (const v of incoming) {
    const i = out.findIndex(x => x.id === v.id);
    if (i < 0) out.push(v);
    else if ((v.updatedAt || 0) >= (out[i].updatedAt || 0)) out[i] = v;
  }
  return out;
}
