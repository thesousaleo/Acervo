import { Check } from 'lucide-react';
import { useLibrary } from '../store/useLibrary';

export function Toast() {
  const { toastMsg } = useLibrary();
  return (
    <div className={`toast glass ${toastMsg ? 'show' : ''} ${toastMsg?.action ? 'has-action' : ''}`} role="status" aria-live="polite">
      {toastMsg && <><Check className="i" aria-hidden />{toastMsg.text}
        {toastMsg.action && <button className="toast-a" onClick={toastMsg.action.run}>{toastMsg.action.label}</button>}</>}
    </div>
  );
}
