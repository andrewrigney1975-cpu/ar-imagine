// Registers the Imagine service worker. Skipped in the desktop (file://) and
// Android (Capacitor) builds, which bundle the app and have nothing to cache.
if ('serviceWorker' in navigator && location.protocol === 'https:' && !window.Capacitor) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .catch((err) => console.warn('[Imagine] service worker registration failed:', err));
  });
}
