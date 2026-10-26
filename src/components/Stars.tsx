export function Stars({ n }: { n: number }) {
  return (
    <span className="stars" aria-label={`Nota ${String(n).replace('.', ',')} de 5`}>
      {[1, 2, 3, 4, 5].map(i => <span key={i} className="st" style={{ ['--f' as any]: `${n >= i ? 100 : n >= i - .5 ? 50 : 0}%` }}>★</span>)}
    </span>
  );
}

export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="star-in">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className="st" style={{ ['--f' as any]: `${value >= i ? 100 : value >= i - .5 ? 50 : 0}%` }}>★
          <button type="button" className="h l" aria-label={`${i - .5} estrelas`} onClick={() => onChange(i - .5)} />
          <button type="button" className="h r" aria-label={`${i} estrelas`} onClick={() => onChange(i)} />
        </span>
      ))}
      <output>{value ? String(value).replace('.', ',') : '—'}</output>
      {value > 0 && <button type="button" className="btn ghost" onClick={() => onChange(0)}>Limpar</button>}
    </div>
  );
}
