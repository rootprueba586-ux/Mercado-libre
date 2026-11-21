//   GET /api/search?q=&brand=&category=&priceMin=&priceMax=
import { Router } from 'express';
import { SearchQuery } from './search.model.ts';
import type { SearchRepository } from './search.repository.ts';

export function createSearchRouter(search: SearchRepository): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    const query = SearchQuery.parse({
      q: req.query.q,
      brand: req.query.brand,
      category: req.query.category,
      priceMin: req.query.priceMin,
      priceMax: req.query.priceMax,
    });
    res.json(await search.search(query));
  });

  return router;
}
