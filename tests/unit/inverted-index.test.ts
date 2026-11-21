// Pruebas del índice invertido (reto H9.1).
// Cuando implementes normalize / intersección / ranking en src/shared/algorithms/,
// cambia it.todo por it y escribe las aserciones. Referencia: Aceite laboratorio/busqueda.
import { describe, it } from 'vitest';

describe('inverted index (H9.1)', () => {
  it.todo('normaliza texto: minúsculas, sin acentos ni guiones');
  it.todo('tokeniza un título en términos únicos');
  it.todo('intersecta posting lists (AND de todos los tokens)');
  it.todo('suma pesos por campo (sku > title > brand > tag > category)');
  it.todo('aplica filtros de marca, categoría y precio sobre los candidatos');
});
