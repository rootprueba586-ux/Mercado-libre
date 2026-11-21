// Rutas HTTP del catálogo de repuestos.
//
//   GET    /api/parts       200 lista
//   GET    /api/parts/:id   200 · 404
//   POST   /api/parts       201 · 400
//   PUT    /api/parts/:id   200 · 400 · 404
//   DELETE /api/parts/:id   204 · 404
import { Router } from 'express';
import { z } from 'zod';
import { PartInput } from './part.model.ts';
import type { PartRepository } from './part.repository.ts';

const IdParam = z.coerce.number().int().positive();

export function createPartRouter(parts: PartRepository): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await parts.list());
  });

  router.get('/:id', async (req, res) => {
    const part = await parts.findById(IdParam.parse(req.params.id));
    if (!part) {
      res.status(404).json({ error: 'Repuesto no encontrado' });
      return;
    }
    res.json(part);
  });

  router.post('/', async (req, res) => {
    const input = PartInput.parse(req.body);
    res.status(201).json(await parts.create(input));
  });

  router.put('/:id', async (req, res) => {
    const part = await parts.update(IdParam.parse(req.params.id), PartInput.parse(req.body));
    if (!part) {
      res.status(404).json({ error: 'Repuesto no encontrado' });
      return;
    }
    res.json(part);
  });

  router.delete('/:id', async (req, res) => {
    const removed = await parts.remove(IdParam.parse(req.params.id));
    res.status(removed ? 204 : 404).end();
  });

  return router;
}
