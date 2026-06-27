// feedback.js — renders the toast stack and the confirm dialog driven by uiStore.

import { useEffect } from 'react';
import { useUI } from './uiStore';

const ICON = { success: '✓', error: '!', info: 'i' };

export const Toaster = () => {
  const toasts = useUI((s) => s.toasts);
  const dismiss = useUI((s) => s.dismissToast);
  if (!toasts.length) return null;
  return (
    <div className="vs-toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`vs-toast vs-toast--${t.type}`} role="status" onClick={() => dismiss(t.id)}>
          <span className="vs-toast__icon" aria-hidden="true">{ICON[t.type] || 'i'}</span>
          <span className="vs-toast__msg">{t.message}</span>
          <button
            type="button"
            className="vs-toast__x"
            aria-label="Dismiss"
            onClick={(e) => { e.stopPropagation(); dismiss(t.id); }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export const ConfirmDialog = () => {
  const cs = useUI((s) => s.confirmState);
  const close = useUI((s) => s.closeConfirm);

  useEffect(() => {
    if (!cs) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close(false);
      if (e.key === 'Enter') close(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cs, close]);

  if (!cs) return null;

  return (
    <div className="vs-modal__scrim" onMouseDown={() => close(false)}>
      <div className="vs-modal vs-confirm" onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="vs-modal__title">{cs.title}</h2>
        {cs.message && <p className="vs-confirm__msg">{cs.message}</p>}
        <div className="vs-modal__actions">
          <button type="button" className="vs-clear" onClick={() => close(false)}>{cs.cancelLabel}</button>
          <button
            type="button"
            className={cs.tone === 'danger' ? 'vs-check' : 'vs-run'}
            onClick={() => close(true)}
            autoFocus
          >
            {cs.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
