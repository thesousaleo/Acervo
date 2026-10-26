import { CATS } from '../data/catalog';
import { asDate, today } from '../lib/dates';
import { useLibrary } from '../store/useLibrary';
import type { MediaItem } from '../types/media';
import { Cover } from './Cover';

export function upcomingOf(items: MediaItem[], days = 45) {
  const t = today(), lim = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
  return (items as any[]).filter(i => i.proximoEp?.data && i.proximoEp.data >= t && i.proximoEp.data <= lim && i.status !== 'abandonado' && i.status !== 'concluido')
    .sort((a, b) => a.proximoEp.data.localeCompare(b.proximoEp.data));
}
const quando = (iso: string) => {
  const t = today(), tm = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  if (iso === t) return 'hoje'; if (iso === tm) return 'amanhã';
  return asDate(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace(/\./g, '');
};

/** Lista de próximos episódios. */
export function Upcoming({ list }: { list: any[] }) {
  const { openEditor } = useLibrary();
  return (
    <ul className="rows">
      {list.map(it => (
        <li key={it.id} className="row-i" style={{ ['--c' as any]: CATS[it.categoria as keyof typeof CATS].color }}>
          <span className={`r-date ${quando(it.proximoEp.data) === 'hoje' ? 'hot' : ''}`}>{quando(it.proximoEp.data)}</span>
          <button className="r-cv" onClick={() => openEditor(it.id)} aria-label={`Editar ${it.titulo}`}><Cover it={it} size="xs" /></button>
          <button className="r-tx" onClick={() => openEditor(it.id)}><b>{it.titulo}</b><span>{it.proximoEp.temporada ? `T${it.proximoEp.temporada}E${it.proximoEp.episodio}` : `Episódio ${it.proximoEp.episodio}`}{it.proximoEp.nome ? ` · ${it.proximoEp.nome}` : ''}</span></button>
          <span className="r-end" />
        </li>
      ))}
    </ul>
  );
}
