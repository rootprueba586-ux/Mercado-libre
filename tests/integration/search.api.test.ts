// API de búsqueda: filtros sin q; con q → notImplemented hasta el índice a mano.
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app/create-app.ts';
import { createPool } from '../../src/shared/db.ts';

try {
  process.loadEnvFile('.env');
} catch {
  // En CI no hay .env.
}

const pool = createPool(process.env.TEST_DATABASE_URL!);
const app = createApp({ pool });

beforeEach(async () => {
  await pool.query('TRUNCATE search_terms, parts RESTART IDENTITY CASCADE');
  await pool.query(
    `INSERT INTO parts (title, brand, category, sku, price) VALUES
       ('Filtro de aceite', 'Mann', 'filters', 'FLT-1', 12),
       ('Pastillas de freno', 'Bosch', 'brakes', 'BRK-1', 45),
       ('Alternador', 'Valeo', 'electrical', 'ELC-1', 120)`,
  );
});

afterAll(async () => {
  await pool.end();
});

describe('API /api/search', () => {
  it('sin q lista por filtros de marca y categoría', async () => {
    const res = await request(app).get('/api/search').query({ brand: 'Mann', category: 'filters' });
    expect(res.status).toBe(200);
    expect(res.body.notImplemented).toBe(false);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0]).toMatchObject({ title: 'Filtro de aceite', brand: 'Mann' });
  });

  it('filtra por rango de precio', async () => {
    const res = await request(app).get('/api/search').query({ priceMin: 40, priceMax: 50 });
    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].title).toBe('Pastillas de freno');
  });

  it('con q responde contrato notImplemented sin romper', async () => {
    const res = await request(app).get('/api/search').query({ q: 'freno' });
    expect(res.status).toBe(200);
    expect(res.body.notImplemented).toBe(true);
    expect(res.body.results).toEqual([]);
    expect(typeof res.body.message).toBe('string');
  });

  it('rechaza priceMin > priceMax con 400', async () => {
    const res = await request(app).get('/api/search').query({ priceMin: 90, priceMax: 10 });
    expect(res.status).toBe(400);
  });
});
