export const SIDEBAR_REFRESH = 'vp-todo:sidebar-refresh';

export function emitSidebarRefresh() {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new Event(SIDEBAR_REFRESH));
}
