// Repositorio de repuestos: único lugar con SQL de la entidad parts.
// TODO (alumno): al create/update, sincronizar search_terms (ver Aceite sync.mjs).
import type { Pool } from '../shared/db.ts';
import type { Part, PartCategory, PartInput } from './part.model.ts';

type PartRow = {
  id: number;
  title: string;
  brand: string;
  category: string;
  sku: string;
  price: string | null;
  image_url: string;
  created_at: Date;
};

const COLUMNS = 'id, title, brand, category, sku, price, image_url, created_at';

function toPart(row: PartRow): Part {
  return {
    id: row.id,
    title: row.title,
    brand: row.brand,
    category: row.category as PartCategory,
    sku: row.sku,
    price: row.price === null ? null : Number(row.price),
    imageUrl: row.image_url,
    createdAt: row.created_at.toISOString(),
  };
}

export function createPartRepository(pool: Pool) {
  return {
    async list(): Promise<Part[]> {
      const { rows } = await pool.query<PartRow>(
        `SELECT ${COLUMNS} FROM parts ORDER BY title ASC, id ASC LIMIT 500`,
      );
      return rows.map(toPart);
    },

    async findById(id: number): Promise<Part | null> {
      const { rows } = await pool.query<PartRow>(`SELECT ${COLUMNS} FROM parts WHERE id = $1`, [id]);
      const row = rows[0];
      return row ? toPart(row) : null;
    },

    async create(input: PartInput): Promise<Part> {
      // TODO: regenerar search_terms para este part (índice invertido a mano).
      const { rows } = await pool.query<PartRow>(
        `INSERT INTO parts (title, brand, category, sku, price, image_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING ${COLUMNS}`,
        [input.title, input.brand, input.category, input.sku, input.price, input.imageUrl],
      );
      return toPart(rows[0]!);
    },

    async update(id: number, input: PartInput): Promise<Part | null> {
      // TODO: regenerar search_terms para este part (índice invertido a mano).
      const { rows } = await pool.query<PartRow>(
        `UPDATE parts
         SET title = $2, brand = $3, category = $4, sku = $5, price = $6, image_url = $7
         WHERE id = $1
         RETURNING ${COLUMNS}`,
        [id, input.title, input.brand, input.category, input.sku, input.price, input.imageUrl],
      );
      const row = rows[0];
      return row ? toPart(row) : null;
    },

    async remove(id: number): Promise<boolean> {
      // search_terms se borran solos por ON DELETE CASCADE.
      const result = await pool.query('DELETE FROM parts WHERE id = $1', [id]);
      return (result.rowCount ?? 0) > 0;
    },
  };
}

export type PartRepository = ReturnType<typeof createPartRepository>;
