// Punto de entrada del frontend. El catálogo se carga con el seed; no hay alta rápida en la página.
import { startSearchView } from '../../search/search.view.ts';

/** Cierra el loader de marca tras la animación (o al instante si hay reduced-motion). */
function dismissPageLoader(): void {
  const loader = document.getElementById('page-loader');
  if (!(loader instanceof HTMLElement)) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const holdMs = reduceMotion ? 0 : 2100;
  const fadeMs = reduceMotion ? 0 : 420;

  window.setTimeout(() => {
    loader.classList.add('is-done');
    loader.setAttribute('aria-busy', 'false');
    window.setTimeout(() => loader.remove(), fadeMs);
  }, holdMs);
}

dismissPageLoader();
startSearchView();
