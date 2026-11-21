// API de búsqueda: filtros y texto sobre el catálogo (nombre, marca, SKU, viscosidad…).
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
    `INSERT INTO parts (title, brand, category, sku, price, viscosity, base) VALUES
       ('Filtro de aceite', 'Mann', 'Filtros', 'FLT-1', 12, '', ''),
       ('Pastillas de freno', 'ACDelco', 'Frenos', 'BRK-1', 45, '', ''),
       ('SKY F1 0W-20 sintético', 'SKY', 'Lubricantes', 'SKY-0W20', 9.99, '0W-20', 'Sintético')`,
  );
});

afterAll(async () => {
  await pool.end();
});

describe('API /api/search', () => {
  it('sin q lista Lubricantes con viscosidad', async () => {
    const res = await request(app).get('/api/search').query({ category: 'Lubricantes' });
    expect(res.status).toBe(200);
    expect(res.body.notImplemented).toBe(false);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0]).toMatchObject({
      brand: 'SKY',
      category: 'Lubricantes',
      viscosity: '0W-20',
      base: 'Sintético',
    });
  });

  it('filtra por marca Motul-equivalente SKY y precio', async () => {
    const res = await request(app).get('/api/search').query({ brand: 'SKY', priceMin: 9, priceMax: 10 });
    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(1);
  });

  it('con q encuentra por viscosidad y sigue respetando la categoría', async () => {
    const hit = await request(app).get('/api/search').query({ q: '0w-20' });
    expect(hit.status).toBe(200);
    expect(hit.body.notImplemented).toBe(false);
    expect(hit.body.results.map((item: { sku: string }) => item.sku)).toEqual(['SKY-0W20']);

    const miss = await request(app).get('/api/search').query({ q: '0w20', category: 'Frenos' });
    expect(miss.status).toBe(200);
    expect(miss.body.results).toEqual([]);
  });

  it('con q encuentra por marca aunque el título no la traiga', async () => {
    const res = await request(app).get('/api/search').query({ q: 'acdelco' });
    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].brand).toBe('ACDelco');
  });

  it('rechaza priceMin > priceMax con 400', async () => {
    const res = await request(app).get('/api/search').query({ priceMin: 90, priceMax: 10 });
    expect(res.status).toBe(400);
  });
});
