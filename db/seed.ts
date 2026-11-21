// Datos de prueba (H10.3). Ejecuta: npm run seed
// Incluye tasks de la plantilla + repuestos + algunas filas demo en search_terms
// (términos escritos a mano; el sync automático lo hace el alumno después).
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Falta DATABASE_URL. Copia .env.example a .env.');
  process.exit(1);
}

const PARTS = [
  { title: 'Pastillas de freno delanteras', brand: 'Bosch', category: 'brakes', sku: 'BRK-PAD-001', price: 45.5 },
  { title: 'Disco de freno ventilado', brand: 'Brembo', category: 'brakes', sku: 'BRK-DSC-002', price: 78 },
  { title: 'Filtro de aceite', brand: 'Mann', category: 'filters', sku: 'FLT-OIL-010', price: 12.3 },
  { title: 'Filtro de aire', brand: 'Mann', category: 'filters', sku: 'FLT-AIR-011', price: 18.9 },
  { title: 'Filtro de cabina', brand: 'Bosch', category: 'filters', sku: 'FLT-CAB-012', price: 22 },
  { title: 'Bujía iridium', brand: 'NGK', category: 'engine', sku: 'ENG-SPK-020', price: 9.5 },
  { title: 'Correa de distribución', brand: 'Gates', category: 'engine', sku: 'ENG-BLT-021', price: 65 },
  { title: 'Bomba de agua', brand: 'Gates', category: 'engine', sku: 'ENG-PMP-022', price: 54 },
  { title: 'Alternador 12V', brand: 'Valeo', category: 'electrical', sku: 'ELC-ALT-030', price: 120 },
  { title: 'Batería 60Ah', brand: 'Bosch', category: 'electrical', sku: 'ELC-BAT-031', price: 95 },
  { title: 'Amortiguador delantero', brand: 'Monroe', category: 'suspension', sku: 'SUS-SHK-040', price: 70 },
  { title: 'Resorte helicoidal', brand: 'Monroe', category: 'suspension', sku: 'SUS-SPR-041', price: 48 },
  { title: 'Espejo retrovisor izquierdo', brand: 'TYC', category: 'body', sku: 'BDY-MIR-050', price: 35 },
  { title: 'Faro delantero derecho', brand: 'TYC', category: 'body', sku: 'BDY-LGT-051', price: 88 },
  { title: 'Aceite sintético 5W30', brand: 'Mobil', category: 'other', sku: 'OTH-OIL-060', price: 28 },
  { title: 'Kit de herramientas básico', brand: 'Stanley', category: 'other', sku: 'OTH-TLS-061', price: 40 },
  { title: 'Sensor ABS rueda', brand: 'Bosch', category: 'brakes', sku: 'BRK-ABS-003', price: 32 },
  { title: 'Bobina de encendido', brand: 'NGK', category: 'electrical', sku: 'ELC-COI-032', price: 27 },
] as const;

const TOTAL_TASKS = 100;
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
  for (const part of PARTS) {
    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO parts (title, brand, category, sku, price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [part.title, part.brand, part.category, part.sku, part.price],
    );
    insertedIds.push(rows[0]!.id);
  }

  // Demo estática del índice (2–3 productos). No es el algoritmo de sync.
  const demoTerms: { partIndex: number; term: string; field: string }[] = [
    { partIndex: 0, term: 'pastillas', field: 'title' },
    { partIndex: 0, term: 'freno', field: 'title' },
    { partIndex: 0, term: 'bosch', field: 'brand' },
    { partIndex: 0, term: 'brk-pad-001', field: 'sku' },
    { partIndex: 0, term: 'brakes', field: 'category' },
    { partIndex: 2, term: 'filtro', field: 'title' },
    { partIndex: 2, term: 'aceite', field: 'title' },
    { partIndex: 2, term: 'mann', field: 'brand' },
    { partIndex: 2, term: 'flt-oil-010', field: 'sku' },
    { partIndex: 8, term: 'alternador', field: 'title' },
    { partIndex: 8, term: 'valeo', field: 'brand' },
    { partIndex: 8, term: 'elc-alt-030', field: 'sku' },
  ];

  for (const item of demoTerms) {
    const partId = insertedIds[item.partIndex];
    if (partId === undefined) continue;
    await client.query(
      `INSERT INTO search_terms (term, part_id, field) VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [item.term, partId, item.field],
    );
  }

  await client.query('COMMIT');
  console.log(
    `Listo: ${TOTAL_TASKS} tareas, ${PARTS.length} repuestos y ${demoTerms.length} términos demo en search_terms.`,
  );
} catch (error) {
  await client.query('ROLLBACK');
  console.error('No se pudieron cargar los datos:', (error as Error).message);
  process.exitCode = 1;
} finally {
  await client.end();
}
