// Datos de prueba (H10.3). Ejecuta: npm run seed
// Fuente: db/data/products.json (copia del catálogo Aceite) — mismos nombre, marca,
// categoría, SKU, precio, imagen; viscosidad/base como en laboratorio/busqueda/sync.mjs.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { PartCategory } from '../src/parts/part.model.ts';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Falta DATABASE_URL. Copia .env.example a .env.');
  process.exit(1);
}

type AceiteProduct = {
  id: string;
  name: string;
  brand: string;
  category: string;
  sku: string;
  price: number | null;
  image: string;
  searchTags?: string[];
};

function gradoDe(texto: string): string {
  const match = String(texto).match(/(?:^|[^\d])(\d{1,2})\s*w[\s\u2010\u2011\u2013\u2014-]?(\d{2})\b/i);
  if (match) return `${match[1]}W-${match[2]}`;
  if (/\batf\b/i.test(texto) || /\bdexron\b/i.test(texto)) return 'ATF';
  return '';
}

function baseDe(texto: string): string {
  const actual = String(texto);
  if (/semi[\s-]*sint|technosynthese|synthetic blend|mezcla sint|\bblend\b/i.test(actual)) {
    return 'Semi sintético';
  }
  if (/full[\s-]*sint|100\s*%\s*sint|totalmente sint/i.test(actual)) return 'Full sintético';
  if (/\bsemi\b/i.test(actual) && /sint/i.test(actual)) return 'Semi sintético';
  if (/sint[eé]tic/i.test(actual)) return 'Sintético';
  if (/mineral|conventional|convencional/i.test(actual)) return 'Mineral';
  return '';
}

function baseDeEtiquetas(etiquetas: string[]): string {
  const set = new Set(etiquetas.map((e) => e.toLowerCase()));
  if (set.has('semi') && (set.has('sintetico') || set.has('sintetica'))) return 'Semi sintético';
  if ((set.has('full') || set.has('100')) && set.has('sintetico')) return 'Full sintético';
  if (set.has('mineral')) return 'Mineral';
  if (set.has('sintetico') || set.has('sintetica')) return 'Sintético';
  return '';
}

function fichaDe(producto: AceiteProduct): { viscosity: string; base: string } {
  const tags = producto.searchTags ?? [];
  const gradoEtiqueta = tags.map((t) => gradoDe(t)).find(Boolean) ?? '';
  const viscosity =
    gradoDe(producto.name) || gradoDe(producto.sku) || gradoEtiqueta;
  const base = baseDe(producto.name) || baseDeEtiquetas(tags);
  return { viscosity, base };
}

const productsPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'data/products.json');
const catalog = JSON.parse(readFileSync(productsPath, 'utf8')) as AceiteProduct[];

for (const product of catalog) {
  PartCategory.parse(product.category);
}

const TOTAL_TASKS = 50;
const client = new pg.Client({ connectionString: url });
await client.connect();

try {
  await client.query('BEGIN');
  await client.query('TRUNCATE search_terms, parts, tasks RESTART IDENTITY');

  await client.query(
    `INSERT INTO tasks (title, done, created_at)
     SELECT 'Tarea de prueba ' || n,
            n % 3 = 0,
            now() - (n || ' minutes')::interval
     FROM generate_series(1, $1::int) AS n`,
    [TOTAL_TASKS],
  );

  const insertedIds: number[] = [];
  for (const product of catalog) {
    const ficha = fichaDe(product);
    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO parts (title, brand, category, sku, price, image_url, viscosity, base, external_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        product.name,
        product.brand,
        product.category,
        product.sku ?? '',
        product.price,
        product.image ?? '',
        ficha.viscosity,
        ficha.base,
        product.id,
      ],
    );
    insertedIds.push(rows[0]!.id);
  }

  // Términos demo desde searchTags de los 3 primeros (no es el sync completo).
  for (let i = 0; i < Math.min(3, catalog.length); i += 1) {
    const product = catalog[i]!;
    const partId = insertedIds[i]!;
    const terms = [
      { term: product.brand.toLowerCase(), field: 'brand' },
      { term: product.category.toLowerCase(), field: 'category' },
      { term: product.sku.toLowerCase(), field: 'sku' },
      ...(product.searchTags ?? []).slice(0, 6).map((term) => ({
        term: term.toLowerCase(),
        field: 'tag' as const,
      })),
    ];
    for (const item of terms) {
      await client.query(
        `INSERT INTO search_terms (term, part_id, field) VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [item.term, partId, item.field],
      );
    }
  }

  await client.query('COMMIT');

  const brands = [...new Set(catalog.map((p) => p.brand))];
  const byCategory = catalog.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`Listo: ${catalog.length} productos Aceite, ${brands.length} marcas, ${TOTAL_TASKS} tareas.`);
  console.log('Por categoría:', byCategory);
} catch (error) {
  await client.query('ROLLBACK');
  console.error('No se pudieron cargar los datos:', (error as Error).message);
  process.exitCode = 1;
} finally {
  await client.end();
}
