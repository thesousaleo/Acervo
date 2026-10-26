import { useEffect, useRef } from 'react';
import { useLibrary } from '../store/useLibrary';

export function MeshBackground() {
  const { u } = useLibrary();
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const m = ref.current; if (!m) return;
    m.classList.remove('swap'); void m.offsetWidth; m.classList.add('swap');
  }, [u]);
  return <div className="mesh" ref={ref} aria-hidden><span className="b1" /><span className="b2" /><span className="b3" /><span className="b4" /></div>;
}
