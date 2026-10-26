import { GOALS, goalProgress, metasDo, type GoalKey } from '../lib/goals';
import { useLibrary } from '../store/useLibrary';

/** Barras de progresso das metas do ano. */
export function GoalBars({ ano, editable = false }: { ano: string; editable?: boolean }) {
  const { items, config, setConfig } = useLibrary();
  const m = metasDo(config, ano), p = goalProgress(items, ano);
  const setGoal = (k: GoalKey, v: string) => setConfig(c => {
    const metas = c.metas.filter(x => x.ano !== ano);
    return { ...c, metas: [...metas, { ...metasDo(c, ano), [k]: v === '' ? undefined : Math.max(0, Number(v)) }] };
  });
  const rows = GOALS.filter(([k]) => editable || (m as any)[k]);
  if (!rows.length) return null;
  return (
    <ul className="goals">
      {rows.map(([k, label, color]) => {
        const alvo = (m as any)[k] as number | undefined, feito = p[k];
        const pct = alvo ? Math.min(100, feito / alvo * 100) : 0;
        return (
          <li key={k} style={{ ['--c' as any]: color }}>
            <div className="g-top">
              <span>{label}</span>
              <span className="g-num">{feito.toLocaleString('pt-BR')}{alvo ? <> / {alvo.toLocaleString('pt-BR')}</> : ''}
                {editable && <input className="g-in" type="number" min={0} inputMode="numeric" aria-label={`Meta de ${label}`} placeholder="meta" value={alvo ?? ''} onChange={e => setGoal(k, e.target.value)} />}
              </span>
            </div>
            <div className="line"><i style={{ width: `${pct}%` }} /></div>
          </li>
        );
      })}
    </ul>
  );
}
