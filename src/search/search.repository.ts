// Búsqueda: filtros SQL siempre; texto libre (q) queda para el índice invertido a mano.
// No importa src/shared/algorithms todavía: el alumno cableará normalize/intersect ahí.
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
};

function toItem(row: PartRow, score = 0): SearchResultItem {
  return {
    id: row.id,
    title: row.title,
    brand: row.brand,
    category: row.category,
    sku: row.sku,
    price: row.price === null ? null : Number(row.price),
    imageUrl: row.image_url,
    score,
  };
}

export function createSearchRepository(pool: Pool) {
  return {
    async search(query: SearchQuery): Promise<SearchResponse> {
      // Con texto libre: aún no hay algorithms. Contrato estable para la UI y las pruebas.
      if (query.q.length > 0) {
        return {
          query,
          results: [],
          notImplemented: true,
          message:
            'La búsqueda por texto (índice invertido) la implementas tú en src/shared/algorithms/. Mira Aceite laboratorio/busqueda (buscar.mjs / sync.mjs).',
        };
      }

      const { rows } = await pool.query<PartRow>(
        `SELECT id, title, brand, category, sku, price, image_url
         FROM parts
         WHERE ($1 = '' OR brand = $1)
           AND ($2 = '' OR category = $2)
           AND ($3::numeric IS NULL OR (price IS NOT NULL AND price >= $3))
           AND ($4::numeric IS NULL OR (price IS NOT NULL AND price <= $4))
         ORDER BY title ASC, id ASC
         LIMIT 500`,
        [query.brand, query.category, query.priceMin, query.priceMax],
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
