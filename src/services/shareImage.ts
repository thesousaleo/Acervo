import { Capacitor } from '@capacitor/core';
import { CATS } from '../data/catalog';
import { hue } from '../lib/progress';
import type { MediaItem } from '../types/media';

const W = 1080, H = 1350;
const FONT_D = '"Bricolage Grotesque Variable", "Bricolage Grotesque", system-ui, sans-serif';
const FONT_B = '"Manrope Variable", Manrope, system-ui, sans-serif';

function bg(ctx: CanvasRenderingContext2D, color: string) {
  ctx.fillStyle = '#06080F'; ctx.fillRect(0, 0, W, H);
  const g1 = ctx.createRadialGradient(200, 160, 0, 200, 160, 900); g1.addColorStop(0, color + '88'); g1.addColorStop(1, '#06080F00');
  ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
  const g2 = ctx.createRadialGradient(W, H, 0, W, H, 800); g2.addColorStop(0, '#4F46E566'); g2.addColorStop(1, '#06080F00');
  ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
}
function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number, maxLines: number) {
  const words = text.split(/\s+/); let line = '', lines = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + ' ' + words[i] : words[i];
    if (ctx.measureText(test).width > maxW && line) {
      if (lines === maxLines - 1) { ctx.fillText(line + '…', x, y); return y + lh; }
      ctx.fillText(line, x, y); y += lh; lines++; line = words[i];
    } else line = test;
  }
  if (line) { ctx.fillText(line, x, y); y += lh; }
  return y;
}
function stars(ctx: CanvasRenderingContext2D, n: number, x: number, y: number, size: number) {
  ctx.font = `${size}px ${FONT_B}`;
  for (let i = 1; i <= 5; i++) {
    const f = n >= i ? 1 : n >= i - .5 ? .5 : 0, sx = x + (i - 1) * size * 1.1;
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillText('★', sx, y);
    if (f) { ctx.save(); ctx.beginPath(); ctx.rect(sx, y - size, size * f, size * 1.4); ctx.clip(); ctx.fillStyle = '#FBCB5A'; ctx.fillText('★', sx, y); ctx.restore(); }
  }
}
function footer(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = `600 30px ${FONT_B}`; ctx.fillText('Acervo', 80, H - 70);
}
const loadImg = (src: string) => new Promise<HTMLImageElement | null>(res => {
  if (!src) return res(null);
  const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = () => res(null); i.src = src;
});

async function itemCard(it: MediaItem, withImage: boolean): Promise<Blob> {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d')!; const col = CATS[it.categoria].color;
  bg(ctx, col);
  const cw = 420, ch = 630, cx = 80, cy = 120;
  const img = withImage ? await loadImg(it.capaUrl) : null;
  ctx.save(); ctx.beginPath(); (ctx as any).roundRect ? (ctx as any).roundRect(cx, cy, cw, ch, 28) : ctx.rect(cx, cy, cw, ch); ctx.clip();
  if (img) { const r = Math.max(cw / img.width, ch / img.height); ctx.drawImage(img, cx + (cw - img.width * r) / 2, cy + (ch - img.height * r) / 2, img.width * r, img.height * r); }
  else { const h = hue(it.titulo); const g = ctx.createLinearGradient(cx, cy, cx + cw, cy + ch); g.addColorStop(0, `hsl(${h} 72% 52%)`); g.addColorStop(1, `hsl(${(h + 96) % 360} 58% 12%)`); ctx.fillStyle = g; ctx.fillRect(cx, cy, cw, ch);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.font = `800 380px ${FONT_D}`; ctx.fillText(it.titulo.charAt(0).toUpperCase(), cx + 150, cy + 420); }
  ctx.restore();
  const tx = 80; let y = cy + ch + 90;
  ctx.fillStyle = col; ctx.font = `700 30px ${FONT_B}`; ctx.fillText(`${CATS[it.categoria].label.toUpperCase()}${it.dataConclusao ? ' · ' + new Date(it.dataConclusao + 'T12:00:00').toLocaleDateString('pt-BR') : ''}`, tx, y);
  ctx.fillStyle = '#EEF0FA'; ctx.font = `800 76px ${FONT_D}`; y = wrap(ctx, it.titulo, tx, y + 84, W - 160, 80, 2);
  if (it.nota) { stars(ctx, it.nota, tx, y + 30, 54); y += 80; }
  if (it.review) { ctx.fillStyle = '#C9CDE3'; ctx.font = `italic 500 36px ${FONT_B}`; wrap(ctx, `“${it.review}”`, tx, y + 30, W - 160, 50, 3); }
  footer(ctx);
  return new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error('canvas')), 'image/png'));
}

export interface RetroData { ano: string; linhas: [string, string][]; destaques: MediaItem[] }
async function retroCard(d: RetroData): Promise<Blob> {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d')!; bg(ctx, '#8B5CF6');
  ctx.fillStyle = '#EEF0FA'; ctx.font = `800 150px ${FONT_D}`; ctx.fillText(d.ano, 80, 250);
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = `600 40px ${FONT_B}`; ctx.fillText('Meu ano no Acervo', 84, 320);
  let y = 470;
  for (const [v, l] of d.linhas.slice(0, 6)) {
    ctx.fillStyle = '#EEF0FA'; ctx.font = `800 86px ${FONT_D}`; ctx.fillText(v, 80, y);
    const vw = ctx.measureText(v).width;
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = `500 38px ${FONT_B}`; ctx.fillText(l, 100 + vw, y - 8);
    y += 120;
  }
  if (d.destaques.length) {
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = `700 28px ${FONT_B}`; ctx.fillText('NOTA MÁXIMA', 80, y + 10);
    ctx.fillStyle = '#EEF0FA'; ctx.font = `600 36px ${FONT_B}`; wrap(ctx, d.destaques.slice(0, 4).map(i => i.titulo).join(' · '), 80, y + 64, W - 160, 48, 3);
  }
  footer(ctx);
  return new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error('canvas')), 'image/png'));
}

async function deliver(blob: Blob, name: string): Promise<'share' | 'download'> {
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const b64 = await new Promise<string>(res => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.readAsDataURL(blob); });
    const f = await Filesystem.writeFile({ path: name, data: b64, directory: Directory.Cache });
    await Share.share({ files: [f.uri], dialogTitle: 'Compartilhar' });
    return 'share';
  }
  const file = new File([blob], name, { type: 'image/png' });
  if ((navigator as any).canShare?.({ files: [file] })) { try { await (navigator as any).share({ files: [file] }); return 'share'; } catch { /* cancelado: baixa */ } }
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'download';
}

export async function shareItem(it: MediaItem) {
  await document.fonts?.ready;
  let blob: Blob;
  try { blob = await itemCard(it, true); } catch { blob = await itemCard(it, false); } // capa sem CORS: usa a capa gerada
  return deliver(blob, `acervo-${it.id.slice(0, 8)}.png`);
}
export async function shareRetro(d: RetroData) {
  await document.fonts?.ready;
  return deliver(await retroCard(d), `acervo-${d.ano}.png`);
}
