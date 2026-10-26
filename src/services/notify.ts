import { Capacitor } from '@capacitor/core';
import type { MediaItem } from '../types/media';
import type { Prefs } from './storage';
import { today } from '../lib/dates';

/** Notificações locais (só no app Android). */
export const canNotify = () => Capacitor.isNativePlatform();

const idOf = (s: string) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h) % 2_000_000_000; };

export async function ensurePermission(): Promise<boolean> {
  if (!canNotify()) return false;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const p = await LocalNotifications.checkPermissions();
  if (p.display === 'granted') return true;
  return (await LocalNotifications.requestPermissions()).display === 'granted';
}

export async function scheduleAll(items: MediaItem[], prefs: Prefs) {
  if (!canNotify()) return;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  if ((await LocalNotifications.checkPermissions()).display !== 'granted') return;
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });

  const list: any[] = [];
  if (prefs.notifLancamentos) {
    const t = today();
    for (const it of items as any[]) {
      const nx = it.proximoEp;
      if (!nx?.data || nx.data < t || it.deletedAt || it.status === 'abandonado') continue;
      const at = new Date(nx.data + 'T10:00:00');
      if (at.getTime() < Date.now()) continue;
      const ep = nx.temporada ? `T${nx.temporada}E${nx.episodio}` : `episódio ${nx.episodio}`;
      list.push({ id: idOf(it.id + nx.data), title: `${it.titulo}: ${ep} hoje`, body: nx.nome ? `“${nx.nome}” já está disponível.` : 'Episódio novo disponível hoje.', schedule: { at } });
    }
  }
  if (prefs.notifLeitura) {
    const [hour, minute] = prefs.horaLeitura.split(':').map(Number);
    const lendo = (items as any[]).find(i => (i.categoria === 'livro' || i.categoria === 'hq') && i.status === 'consumindo' && !i.deletedAt);
    list.push({ id: 1, title: 'Hora da leitura', body: lendo ? `Que tal algumas páginas de ${lendo.titulo}?` : 'Que tal ler um pouco hoje?', schedule: { on: { hour, minute }, allowWhileIdle: true } });
  }
  if (list.length) await LocalNotifications.schedule({ notifications: list.slice(0, 60) });
}
