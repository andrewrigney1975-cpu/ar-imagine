// Registers the Imagine service worker.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .catch((err) => console.warn('[Imagine] service worker registration failed:', err));
  });
}
