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
  viscosity: string;
  base: string;
  external_id: string | null;
  created_at: Date;
};

const COLUMNS =
  'id, title, brand, category, sku, price, image_url, viscosity, base, external_id, created_at';

function toPart(row: PartRow): Part {
  return {
    id: row.id,
    title: row.title,
    brand: row.brand,
    category: row.category as PartCategory,
    sku: row.sku,
    price: row.price === null ? null : Number(row.price),
    imageUrl: row.image_url,
    viscosity: row.viscosity,
    base: row.base,
    externalId: row.external_id,
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
      const { rows } = await pool.query<PartRow>(
        `INSERT INTO parts (title, brand, category, sku, price, image_url, viscosity, base, external_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING ${COLUMNS}`,
        [
          input.title,
          input.brand,
          input.category,
          input.sku,
          input.price,
          input.imageUrl,
          input.viscosity,
          input.base,
          input.externalId,
        ],
      );
      return toPart(rows[0]!);
    },

    async update(id: number, input: PartInput): Promise<Part | null> {
      const { rows } = await pool.query<PartRow>(
        `UPDATE parts
         SET title = $2, brand = $3, category = $4, sku = $5, price = $6,
             image_url = $7, viscosity = $8, base = $9, external_id = $10
         WHERE id = $1
         RETURNING ${COLUMNS}`,
        [
          id,
          input.title,
          input.brand,
          input.category,
          input.sku,
          input.price,
          input.imageUrl,
          input.viscosity,
          input.base,
          input.externalId,
        ],
      );
      const row = rows[0];
      return row ? toPart(row) : null;
    },

    async remove(id: number): Promise<boolean> {
      const result = await pool.query('DELETE FROM parts WHERE id = $1', [id]);
      return (result.rowCount ?? 0) > 0;
    },
  };
}

export type PartRepository = ReturnType<typeof createPartRepository>;
