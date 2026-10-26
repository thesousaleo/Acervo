import { Check } from 'lucide-react';
import { useLibrary } from '../store/useLibrary';

export function Toast() {
  const { toastMsg } = useLibrary();
  return (
    <div className={`toast glass ${toastMsg ? 'show' : ''}`} role="status" aria-live="polite">
      {toastMsg && <><Check className="i" aria-hidden />{toastMsg.text}</>}
    </div>
  );
}
