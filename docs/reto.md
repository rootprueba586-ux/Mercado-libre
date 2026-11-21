# Reto técnico distintivo (H9.1)

**Reto asignado:** Índice invertido para búsqueda + filtros combinados  
**Proyecto:** n.º 3 · Marketplace de repuestos · [Mercado Libre](https://www.mercadolibre.com.ve)

## El problema

En un catálogo grande, buscar por texto libre y a la vez filtrar por marca, categoría y rango de
precio no escala si se hace con `LIKE '%…%'` sobre toda la tabla en cada petición.

Hay que:

1. Indexar de antemano los términos de cada repuesto (índice invertido: término → lista de `part_id`).
2. Resolver la consulta como intersección de las listas de cada token (AND).
3. Cruzar esos candidatos con filtros estructurados (marca, categoría, precio min/max).
4. Ordenar por relevancia (pesos por campo: SKU > título > marca > etiqueta > categoría).

El diseño acordado está en [docs/adr/0003-inverted-index-search.md](adr/0003-inverted-index-search.md).
La implementación en TypeScript/SQL la escribe el estudiante a mano (épica del reto / E4).

## Cómo lo resolví

*(Pendiente: documentar aquí la estructura o algoritmo cuando lo implementes.)*

## Complejidad

*(Pendiente: Big-O en tiempo y memoria de tu implementación.)*

## Cómo probarlo en vivo

1. `docker compose up -d` → `npm run migrate` → `npm run seed` → `npm run dev`
2. Abre http://localhost:5173 · sección **Buscar**: filtros de marca/categoría/precio ya funcionan.
3. Con texto en `q`, la API responde `notImplemented` hasta que wires el índice.
4. Inspecciona `search_terms` (hay filas demo del seed) con Adminer o `psql`.

## Próximo paso del alumno

Portar desde Aceite `laboratorio/busqueda` (`sync.mjs`, `buscar.mjs`) a `src/shared/algorithms/`:

1. `normalizar` + tokens.
2. Construir/actualizar filas en `search_terms` al crear/editar un part.
3. Intersección de posting lists + pesos + cruce con filtros.
4. Enganchar eso en `src/search/search.repository.ts` (quitar `notImplemented`).
5. Completar las secciones “Cómo lo resolví” y “Complejidad” de este documento.
