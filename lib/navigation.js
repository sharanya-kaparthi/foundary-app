// In-app history tracking for Back buttons.
//
// Goal: Back returns to the page the user actually came from, but never drops
// them out of the app (e.g. after opening a deep link, a refresh, or a
// redirect) — in those cases we fall back to a sensible parent page.
//
// Next's pages router gives every history entry a `key` in history.state:
// pushState mints a new key, replaceState keeps the current one. We keep a
// stack of keys: a new key = forward navigation (push), a key already in the
// stack = back/forward or a replace (truncate to it). canGoBackInApp() is true
// only when there is an earlier entry that belongs to this app session.

let stack = [];

function currentKey() {
  return typeof window !== 'undefined' ? window.history.state?.key : undefined;
}

function record() {
  const key = currentKey();
  if (!key) return;
  const idx = stack.indexOf(key);
  stack = idx >= 0 ? stack.slice(0, idx + 1) : [...stack, key];
}

export function startNavigationTracking(routerEvents) {
  record();
  routerEvents.on('routeChangeComplete', record);
  return () => routerEvents.off('routeChangeComplete', record);
}

export function canGoBackInApp() {
  return Boolean(currentKey()) && stack.length > 1;
}

export function goBack(router, fallback = '/home') {
  if (canGoBackInApp()) router.back();
  else router.push(fallback);
}
