// Punto de entrada del frontend.
import { startPartView } from '../../parts/part.view.ts';
import { startSearchView } from '../../search/search.view.ts';

startSearchView();
startPartView();
// tasks queda oculto en el HTML; se puede reactivar cuando haga falta la demo de plantilla.
