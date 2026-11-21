// Punto de entrada del frontend. Arranca las pantallas de cada funcionalidad.
import { startPartView } from '../../parts/part.view.ts';
import { startSearchView } from '../../search/search.view.ts';
import { startTaskView } from '../../tasks/task.view.ts';

startSearchView();
startPartView();
startTaskView();
