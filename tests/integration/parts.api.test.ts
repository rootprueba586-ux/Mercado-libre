// API de repuestos contra PostgreSQL (app_test). Requiere: docker compose up -d
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

const sample = {
  title: 'Pastillas de freno',
  brand: 'Bosch',
  category: 'brakes',
  sku: 'BRK-1',
  price: 40,
  imageUrl: '',
};

beforeEach(async () => {
  await pool.query('TRUNCATE search_terms, parts RESTART IDENTITY CASCADE');
});

afterAll(async () => {
  await pool.end();
});

describe('API /api/parts', () => {
  it('crea un repuesto y lo lista', async () => {
    const created = await request(app).post('/api/parts').send(sample);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ id: 1, title: 'Pastillas de freno', brand: 'Bosch' });

    const list = await request(app).get('/api/parts');
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
  });

  it('rechaza categoría inválida con 400', async () => {
    const res = await request(app).post('/api/parts').send({ ...sample, category: 'lubricantes' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos no válidos');
  });

  it('edita y elimina un repuesto', async () => {
    await request(app).post('/api/parts').send(sample);
    const updated = await request(app)
      .put('/api/parts/1')
      .send({ ...sample, title: 'Pastillas cerámicas', price: 55 });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({ title: 'Pastillas cerámicas', price: 55 });

    expect((await request(app).delete('/api/parts/1')).status).toBe(204);
    expect((await request(app).get('/api/parts/1')).status).toBe(404);
  });
});
