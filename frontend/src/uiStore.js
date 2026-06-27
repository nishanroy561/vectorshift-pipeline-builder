// uiStore.js
// --------------------------------------------------
// In-app UI feedback that replaces the browser's alert()/confirm():
//   - notify(message, type)  → a dismissible toast (info | success | error)
//   - confirm(opts)          → a themed modal, returns a Promise<boolean>

import { create } from 'zustand';

let counter = 0;

export const useUI = create((set, get) => ({
  // Parts bin (left rail) collapsed state — handy now that the bin is long.
  partsCollapsed: false,
  togglePartsBin: () => set({ partsCollapsed: !get().partsCollapsed }),

  toasts: [],
  notify: (message, type = 'info', ttl = 4500) => {
    const id = ++counter;
    set({ toasts: [...get().toasts, { id, message, type }] });
    if (ttl) setTimeout(() => get().dismissToast(id), ttl);
    return id;
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

  // The currently-open confirm dialog (or null). confirm() resolves its promise
  // when the user picks an option.
  confirmState: null,
  confirm: (opts) =>
    new Promise((resolve) => {
      const o = typeof opts === 'string' ? { message: opts } : opts;
      set({
        confirmState: {
          title: 'Are you sure?',
          confirmLabel: 'Confirm',
          cancelLabel: 'Cancel',
          tone: 'default', // 'default' | 'danger'
          ...o,
          resolve,
        },
      });
    }),
  closeConfirm: (result) => {
    const cs = get().confirmState;
    if (cs) cs.resolve(result);
    set({ confirmState: null });
  },
}));

// Convenience wrappers so event handlers can call these without the hook.
export const notify = (...args) => useUI.getState().notify(...args);
export const confirm = (...args) => useUI.getState().confirm(...args);
