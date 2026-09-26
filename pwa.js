// Registers the Imagine service worker. Skipped in the desktop (file://) and
// Android (Capacitor) builds, which bundle the app and have nothing to cache,
// and on insecure origins, where browsers don't allow service workers.
if ('serviceWorker' in navigator && window.isSecureContext &&
    location.protocol !== 'file:' && !window.Capacitor) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .catch((err) => console.warn('[Imagine] service worker registration failed:', err));
  });
}
