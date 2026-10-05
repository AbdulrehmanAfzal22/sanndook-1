// Demo browsing is isolated from real authentication, inventory and orders.
// Changing mode reloads the app so no session or cached catalog crosses modes.
export const catalogModeKey = 'soleform-catalog-mode-v1';

export function chooseCatalogMode({ forcedPreview, search = '', pathname = '/', hash = '', remembered, defaultMode = 'live' } = {}) {
  if (forcedPreview === 'true') return 'demo';
  const requested = new URLSearchParams(search).get('catalog');
  if (requested === 'demo' || requested === 'live') return requested;
  if (forcedPreview === 'false') return 'live';
  // Email callbacks may open in a fresh tab without remembered catalog state.
  // Keep account/admin entry points and Auth token callbacks on the real SDK.
  const authHash = new URLSearchParams(hash.replace(/^#/,''));
  if (/^\/(admin|auth|login|register|reset-password|account|orders|wishlist|support|stock-alerts|exchanges)(\/|$)/.test(pathname)
    || new URLSearchParams(search).has('code') || authHash.has('access_token')) return 'live';
  // Demo records own this reserved UUID range. Fresh real-product links must
  // fetch live inventory even when a visitor last browsed the demo collection.
  if (/^\/product\//.test(pathname)) {
    const demoId=pathname.match(/^\/product\/10000000-0000-4000-8000-(\d{12})\/?$/);
    return demoId && Number(demoId[1])>=1 && Number(demoId[1])<=60 ? 'demo' : 'live';
  }
  if (remembered === 'demo' || remembered === 'live') return remembered;
  return defaultMode === 'demo' ? 'demo' : 'live';
}

export function catalogModeHref(pathname, search, mode) {
  const params = new URLSearchParams(search);
  params.set('catalog', mode === 'demo' ? 'demo' : 'live');
  return `${pathname || '/'}?${params}`;
}
