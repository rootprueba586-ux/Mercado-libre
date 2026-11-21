// Búsqueda: filtros SQL + texto sobre las columnas del catálogo.
// El índice invertido (algorithms) sigue siendo el reto; aquí el texto ya encuentra
// cualquier repuesto por nombre, marca, SKU, categoría, viscosidad o base.
import type { Pool } from '../shared/db.ts';
import type { SearchQuery, SearchResponse, SearchResultItem } from './search.model.ts';

type PartRow = {
  id: number;
  title: string;
  brand: string;
  category: string;
  sku: string;
  price: string | null;
  image_url: string;
  viscosity: string;
  base: string;
};

/** Misma limpieza en JS y en SQL: minúsculas, sin tildes ni guiones, para que «20w50» encuentre «20W-50». */
function compact(value: string): string {
  return value
    .toLowerCase()
    .replaceAll('á', 'a')
    .replaceAll('é', 'e')
    .replaceAll('í', 'i')
    .replaceAll('ó', 'o')
    .replaceAll('ú', 'u')
    .replaceAll('ü', 'u')
    .replaceAll('ñ', 'n')
    .replace(/[^a-z0-9]/g, '');
}

const folded = (column: string): string =>
  `regexp_replace(translate(lower(${column}), 'áéíóúüñ', 'aeiouun'), '[^a-z0-9]', '', 'g')`;

function toItem(row: PartRow, score = 0): SearchResultItem {
  return {
    id: row.id,
    title: row.title,
    brand: row.brand,
    category: row.category,
    sku: row.sku,
    price: row.price === null ? null : Number(row.price),
    imageUrl: row.image_url,
    viscosity: row.viscosity,
    base: row.base,
    score,
  };
}

export function createSearchRepository(pool: Pool) {
  return {
    async search(query: SearchQuery): Promise<SearchResponse> {
      // $5 vacío = sin texto. Si hay texto, tiene que aparecer en alguna columna del repuesto.
      // Los filtros (marca, categoría, precio) se aplican siempre, también con texto.
      const needle = compact(query.q);
      const { rows } = await pool.query<PartRow>(
        `SELECT id, title, brand, category, sku, price, image_url, viscosity, base
         FROM parts
         WHERE ($1 = '' OR brand = $1)
           AND ($2 = '' OR category = $2)
           AND ($3::numeric IS NULL OR (price IS NOT NULL AND price >= $3))
           AND ($4::numeric IS NULL OR (price IS NOT NULL AND price <= $4))
           AND (
             $5 = ''
             OR strpos(${folded('title')}, $5) > 0
             OR strpos(${folded('brand')}, $5) > 0
             OR strpos(${folded('category')}, $5) > 0
             OR strpos(${folded('sku')}, $5) > 0
             OR strpos(${folded('viscosity')}, $5) > 0
             OR strpos(${folded('base')}, $5) > 0
           )
         ORDER BY title ASC, id ASC
         LIMIT 500`,
        [query.brand, query.category, query.priceMin, query.priceMax, needle],
      );

      return {
        query,
        results: rows.map((row) => toItem(row)),
        notImplemented: false,
      };
    },
  };
}

export type SearchRepository = ReturnType<typeof createSearchRepository>;
